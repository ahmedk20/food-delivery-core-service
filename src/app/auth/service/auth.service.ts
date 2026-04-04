import {LoginDTO, RegisterDTO,ForgetPasswordDTO,ResetPasswordDTO} from "../dto/auth.dto";
import {findUserByEmail, findUserExistsByEmailOrPhone,createUser,updateUserPassword} from "../../user/repository/users.repo";
import {UserAlreadyExists, CannotSignAsSystemAdmin, IncorrectCredentials,InvalidOTPError, InvalidRefreshToken} from "../errors";
import {env} from "../../../common/config/env";
import {comparePassword, hashPassword,generateOTP,hashOTP,saveTiming} from "../utils/password.util";
import {User} from "../../user/entity/user.entity";
import {createPasswordReset,findLatestPasswordResetByUserId,updatePasswordResetConsumedAt} from "../repository/password-reset.repo"
import {SystemRole} from "../../user/enums";
import {createAccessToken,createRefreshToken,verifyRefreshToken,decodeJwt} from "../utils/jwt.util";
import type {JwtPayload} from "../utils/jwt.util";
import {createRefreshTokenRecord,findRefreshTokenByHash,revokeRefreshTokenById,revokeRefreshTokenByHash} from "../repository/refresh-token.repo";
import {cacheGet,cacheSet,cacheDel} from "../../../common/redis/redis";
import {restaurantService, RestaurantService} from "../../restaurant/service/restaurant.service";
import {RestaurantDataRequiredError} from "../../restaurant/errors";
import {db} from "../../../common/knex/knex";

async function persistRefreshToken(userId: number, rawToken: string): Promise<void> {
    const hash = hashOTP(rawToken);
    const decoded = decodeJwt(rawToken);
    const exp = decoded.exp as number;
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;

    const id = await createRefreshTokenRecord({
        userId,
        tokenHash: hash,
        expiresAt: new Date(exp * 1000),
        createdAt: new Date(),
    });

    if (ttl > 0) {
        try {
            await cacheSet(`rt:${hash}`, String(id), ttl);
        } catch {
            // Redis failure is non-fatal
        }
    }
}

export class AuthService{
    constructor(private readonly restaurantService:RestaurantService) {}
    register = async (data:RegisterDTO)=>{

        if (data.role==SystemRole.SYSTEM_ADMIN){
            throw CannotSignAsSystemAdmin()
        }
        const existing :boolean = await findUserExistsByEmailOrPhone(data.email, data.phone);
       if(existing){
           throw  UserAlreadyExists()
       }
        const hashedPassword = await hashPassword(data.password)
        const trx = await db.transaction();
        let user
        let restaurant
        try {
            user = await createUser({
               email: data.email,
               phone: data.phone,
               name: data.name,
               passwordHash: hashedPassword,
               systemRole: data.role,
           },trx)
           if (data.role === SystemRole.RESTAURANT_USER) {
               if (data.restaurant == undefined) {
                   throw  RestaurantDataRequiredError;
               }
               restaurant = await this.restaurantService.create(user.id, data.restaurant, trx)
           }
           await trx.commit();
       }catch (e) {
           await trx.rollback();
           throw e;
       }
        const payload:JwtPayload = {userId: user.id, role: data.role, email: user.email}
       const accessToken = await createAccessToken(payload)
       const refreshToken = await createRefreshToken(payload)

       await persistRefreshToken(user.id, refreshToken);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
            }
        }



    }

    login = async (data:LoginDTO)=> {
        // find the user by email input
       const user = await findUserByEmail(data.email);
       if(!user){
           throw IncorrectCredentials()
       }
        // compare passwords
       const match = await comparePassword(data.password,user.passwordHash);
        // if passwords doesnt match throw err
       if(!match){
           throw IncorrectCredentials()
       }
        // generate tokens
       const payload ={userId: user.id,email:user.email,role: user.systemRole};
       const accessToken = await createAccessToken(payload);
       const refreshToken = await createRefreshToken(payload);

       await persistRefreshToken(user.id, refreshToken);

        // return the data
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
            }

        }


    }

    refresh = async (rawToken: string) => {
        const hash = hashOTP(rawToken);

        // Try Redis first, fall back to DB
        let recordId: number | undefined;
        try {
            const cached = await cacheGet(`rt:${hash}`);
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

        // Validate signature + expiry and extract claims in one call
        const payload = await verifyRefreshToken(rawToken).catch(() => {
            throw InvalidRefreshToken();
        });

        // Rotate: revoke old token
        try { await cacheDel(`rt:${hash}`); } catch { /* non-fatal */ }
        await revokeRefreshTokenById(recordId);

        // Issue new tokens
        const newPayload: JwtPayload = { userId: payload.userId, email: payload.email, role: payload.role };
        const newAccessToken = await createAccessToken(newPayload);
        const newRefreshToken = await createRefreshToken(newPayload);

        await persistRefreshToken(payload.userId, newRefreshToken);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    logout = async (rawToken: string | undefined) => {
        if (!rawToken) {
            return;
        }

        const hash = hashOTP(rawToken);

        try { await cacheDel(`rt:${hash}`); } catch { /* non-fatal */ }
        await revokeRefreshTokenByHash(hash);
    }


    forgetPassword = async(data: ForgetPasswordDTO )=> {
        // check if user exists
        const user = await findUserByEmail(data.email);
        if(!user) {
            return
        }
        // generate an otp
        const otp =  generateOTP();
        // hash the otp
        const hashedOtp = hashOTP(otp);
        // insert the otp
        await createPasswordReset({
                userId: user.id,
                otpHash: hashedOtp,
                expiresAt: new Date(Date.now() + (10*60*1000)),
                createdAt: new Date(),
            }
        )
        // TODO: send email
        console.log(`mocked email sent ${otp}`)
    }

    resetPassword =  async(data: ResetPasswordDTO ) => {
        // find user
        const user = await findUserByEmail(data.email);
        if (!user) {
            throw InvalidOTPError()
        }
        // find reset password
        const reset = await findLatestPasswordResetByUserId(user.id);
        console.log(reset)
        if(!reset) {
            throw InvalidOTPError()
        }
        // verify otp and expiry date
        const inputOTPHash = hashOTP(data.otp)
        console.log(inputOTPHash);
        console.log(reset.otpHash);

        console.log(reset.isExpired());
        const isMatch =  saveTiming(inputOTPHash,reset.otpHash);
        if(!isMatch || reset.isExpired() ) {
            throw InvalidOTPError()
        }
        // update user password
        const hashedPassword = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, hashedPassword);
        // update reset password
        await updatePasswordResetConsumedAt(reset.id)
    }

}

export const authService = new AuthService(restaurantService);
