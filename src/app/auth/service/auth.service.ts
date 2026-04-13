import {LoginDTO, RegisterDTO, ForgetPasswordDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {findUserByEmail, findUserExistsByEmailOrPhone, updateUserPassword} from "../../user/repository/users.repo";
import {UserAlreadyExists, CannotSignAsSystemAdmin, IncorrectCredentials, InvalidOTPError, InvalidRefreshToken} from "../errors";
import {comparePassword, hashPassword, generateOTP, hashOTP, saveTiming} from "../utils/password.util";
import {createPasswordReset, findLatestPasswordResetByUserId, updatePasswordResetConsumedAt} from "../repository/password-reset.repo";
import {SystemRole} from "../../user/enums";
import {createAccessToken, createRefreshToken, verifyRefreshToken, decodeJwt} from "../utils/jwt.util";
import type {JwtPayload} from "../utils/jwt.util";
import {createRefreshTokenRecord, findRefreshTokenByHash, revokeRefreshTokenById, revokeRefreshTokenByHash} from "../repository/refresh-token.repo";
import {RestaurantService} from "../../restaurant/service/restaurant.service";
import {RestaurantDataRequiredError} from "../../restaurant/errors";
import {db} from "../../../lib/knex/knex";
import {UserService} from "../../user/service/user.service";
import {MemberService} from "../../rbac/service/member.service";
import {findRestaurantMemberWithRole} from "../../rbac/repository/restaurant_member.repo";
import {findBranchIdsByMemberId} from "../../rbac/repository/member-branch.repo";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {ICacheProvider} from "../../../pkg/cache/cache.interface";
import {IEmailProvider} from "../../../pkg/email/email.interface";

@injectable()
export class AuthService {
    constructor(
        @inject(TOKENS.RestaurantService) private readonly restaurantService: RestaurantService,
        @inject(TOKENS.UserService)        private readonly userService: UserService,
        @inject(TOKENS.MemberService)      private readonly memberService: MemberService,
        @inject(TOKENS.CacheProvider)      private readonly cache: ICacheProvider,
        @inject(TOKENS.EmailProvider)      private readonly email: IEmailProvider,
    ) {}

    private async persistRefreshToken(userId: number, rawToken: string): Promise<void> {
        const hash = hashOTP(rawToken);
        const decoded = decodeJwt(rawToken);
        const exp = decoded.exp as number;
        const ttl = exp - Math.floor(Date.now() / 1000);

        const id = await createRefreshTokenRecord({
            userId,
            tokenHash: hash,
            expiresAt: new Date(exp * 1000),
            createdAt: new Date(),
        });

        if (ttl > 0) {
            try {
                await this.cache.set(`rt:${hash}`, String(id), ttl);
            } catch {
                // Redis failure is non-fatal
            }
        }
    }

    register = async (data: RegisterDTO) => {
        if (data.role == SystemRole.SYSTEM_ADMIN) {
            throw CannotSignAsSystemAdmin();
        }
        const existing = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if (existing) {
            throw UserAlreadyExists();
        }

        const trx = await db.transaction();
        let user;
        let restaurant;
        let restaurantMemberInfo: Record<string, unknown> = {};

        try {
            user = await this.userService.create({
                email: data.email,
                phone: data.phone,
                name: data.name,
                password: data.password,
                systemRole: data.role,
            }, trx);

            if (data.role === SystemRole.RESTAURANT_USER) {
                if (data.restaurant == undefined) {
                    throw RestaurantDataRequiredError;
                }
                restaurant = await this.restaurantService.create(user.id, data.restaurant, trx);
                await this.memberService.createOwnerMember(restaurant.id, user.id, trx);
                restaurantMemberInfo = {
                    restaurantId: restaurant.id,
                    restaurantRole: 'owner',
                    branchIds: [],
                };
            }

            await trx.commit();
        } catch (e) {
            await trx.rollback();
            throw e;
        }

        const payload: JwtPayload = {
            userId: user.id,
            role: data.role,
            email: user.email,
            ...restaurantMemberInfo,
        };
        const accessToken = await createAccessToken(payload);
        const refreshToken = await createRefreshToken(payload);

        await this.persistRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
            },
        };
    }

    login = async (data: LoginDTO) => {
        const user = await findUserByEmail(data.email);
        if (!user) {
            throw IncorrectCredentials();
        }
        const match = await comparePassword(data.password, user.passwordHash);
        if (!match) {
            throw IncorrectCredentials();
        }

        let restaurantMemberInfo = null;
        if (user.systemRole == SystemRole.RESTAURANT_USER) {
            const memberData = await findRestaurantMemberWithRole(user.id);
            if (memberData) {
                const branchIds = await findBranchIdsByMemberId(memberData.member.id);
                restaurantMemberInfo = {
                    restaurantId: memberData.member.restaurantId,
                    restaurantRole: memberData.roleName,
                    branchIds,
                };
            }
        }

        const payload = {userId: user.id, email: user.email, role: user.systemRole, ...restaurantMemberInfo};
        const accessToken = await createAccessToken(payload);
        const refreshToken = await createRefreshToken(payload);

        await this.persistRefreshToken(user.id, refreshToken);

        return {
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
                createdAt: user.createdAt,
            },
        };
    }

    refresh = async (rawToken: string) => {
        const hash = hashOTP(rawToken);

        let recordId: number | undefined;
        try {
            const cached = await this.cache.get(`rt:${hash}`);
            if (cached) {
                recordId = Number(cached);
            }
        } catch {
            // Redis miss — fall through to DB
        }

        if (recordId === undefined) {
            const record = await findRefreshTokenByHash(hash);
            if (!record) {
                throw InvalidRefreshToken();
            }
            recordId = record.id;
        }

        const payload = await verifyRefreshToken(rawToken).catch(() => {
            throw InvalidRefreshToken();
        });

        try { await this.cache.delete(`rt:${hash}`); } catch { /* non-fatal */ }
        await revokeRefreshTokenById(recordId);

        const newPayload: JwtPayload = {userId: payload.userId, email: payload.email, role: payload.role};
        const newAccessToken = await createAccessToken(newPayload);
        const newRefreshToken = await createRefreshToken(newPayload);

        await this.persistRefreshToken(payload.userId, newRefreshToken);

        return {accessToken: newAccessToken, refreshToken: newRefreshToken};
    }

    logout = async (rawToken: string | undefined) => {
        if (!rawToken) return;

        const hash = hashOTP(rawToken);
        try { await this.cache.delete(`rt:${hash}`); } catch { /* non-fatal */ }
        await revokeRefreshTokenByHash(hash);
    }

    forgetPassword = async (data: ForgetPasswordDTO) => {
        const user = await findUserByEmail(data.email);
        if (!user) return;

        const otp = generateOTP();
        const hashedOtp = hashOTP(otp);
        await createPasswordReset({
            userId: user.id,
            otpHash: hashedOtp,
            expiresAt: new Date(Date.now() + (10 * 60 * 1000)),
            createdAt: new Date(),
        });
        await this.email.sendOtpEmail(data.email, otp);
    }

    resetPassword = async (data: ResetPasswordDTO) => {
        const user = await findUserByEmail(data.email);
        if (!user) throw InvalidOTPError();

        const reset = await findLatestPasswordResetByUserId(user.id);
        if (!reset) throw InvalidOTPError();

        const inputOTPHash = hashOTP(data.otp);
        const isMatch = saveTiming(inputOTPHash, reset.otpHash);
        if (!isMatch || reset.isExpired()) {
            throw InvalidOTPError();
        }

        const hashedPassword = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, hashedPassword);
        await updatePasswordResetConsumedAt(reset.id);
    }
}
