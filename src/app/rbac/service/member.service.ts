import {Knex} from "knex";
import {db} from "../../../common/knex/knex";
import {toMs} from "../../../common/utils/time";
import {createPasswordReset} from "../../auth/repository/password-reset.repo";
import {generateOTP, hashOTP} from "../../auth/utils/password.util";
import {SystemRole} from "../../user/enums";
import {UserService} from "../../user/service/user.service";
import {CreateMemberDTO, UpdateMemberDTO, UpdateMemberBranchesDTO} from "../dto/member.dto";
import {MemberBranch} from "../entity/member-branch.entity";
import {MemberStatus} from "../enums";
import {
    CannotCreateOwnerUserError,
    RoleNotFoundError,
    MemberNotFoundError,
    CannotDeleteOwnerError,
} from "../errors";
import {countBranchesByIdsAndRestaurant, setMemberBranches} from "../repository/member-branch.repo";
import {getPermissionsDetailsByRoleName} from "../repository/permission.repo";
import {
    createRestaurantMember,
    findMembersByRestaurantId,
    findMemberWithRoleName,
    updateMember as updateMemberRepo,
    deleteMember as deleteMemberRepo,
} from "../repository/restaurant_member.repo";
import {findRoleByName} from "../repository/role.repo";
import AppError from "../../../common/error/AppError";

export class MemberService {
    constructor(private readonly userService: UserService) {}

    private async validateBranchOwnership(branchIds: number[], restaurantId: number): Promise<void> {
        if (branchIds.length === 0) return;
        const count = await countBranchesByIdsAndRestaurant(branchIds, restaurantId);
        if (count !== branchIds.length) {
            throw new AppError('Some branch IDs do not belong to this restaurant', 400);
        }
    }

    async createOwnerMember(restaurantId: number, userId: number, trx?: Knex): Promise<void> {
        const roleId = await findRoleByName('owner', trx as Knex.Transaction | undefined);
        if (!roleId) throw RoleNotFoundError;

        const now = new Date();
        await createRestaurantMember({
            restaurantId,
            userId,
            roleId,
            status: MemberStatus.ACTIVE,
            createdAt: now,
            updatedAt: now,
        }, trx as Knex);
    }

    async createMember(restaurantId: number, data: CreateMemberDTO) {
        const branchIds = data.branchIds ?? [];

        if (data.role === 'owner') {
            throw CannotCreateOwnerUserError;
        }

        const roleId = await findRoleByName(data.role);
        if (!roleId) throw RoleNotFoundError;

        // Validate branch ownership before the transaction
        await this.validateBranchOwnership(branchIds, restaurantId);

        const trx = await db.transaction();
        try {
            const now = new Date();
            const user = await this.userService.create({
                email: data.email,
                name: data.name,
                phone: data.phoneNumber,
                password: '',
                systemRole: SystemRole.RESTAURANT_USER,
            }, trx);

            const member = await createRestaurantMember({
                restaurantId,
                userId: user.id,
                roleId,
                createdAt: now,
                updatedAt: now,
                status: MemberStatus.INACTIVE,
            }, trx);

            const rows = branchIds.map(branchId => new MemberBranch({
                branchId,
                memberId: member.id,
                createdAt: now,
            }));
            await setMemberBranches(member.id, rows, trx);

            const otp = generateOTP();
            const hashedOtp = hashOTP(otp);
            await createPasswordReset({
                userId: user.id,
                otpHash: hashedOtp,
                expiresAt: new Date(Date.now() + toMs(1, 'h')),
                createdAt: new Date(),
            }, trx);

            // TODO: send email
            console.log(`mocked email sent ${otp}`);

            await trx.commit();

            return {
                message: 'Member invited successfully',
                member: {
                    id: member.id,
                    email: user.email,
                    name: user.name,
                    status: member.status,
                },
            };
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    }

    async listMembers(restaurantId: number) {
        const members = await findMembersByRestaurantId(restaurantId);
        return { data: members };
    }

    async updateMember(restaurantId: number, memberId: number, data: UpdateMemberDTO) {
        const result = await findMemberWithRoleName(memberId);
        if (!result) throw MemberNotFoundError;

        if (Number(result.member.restaurantId) !== Number(restaurantId)) {
            throw MemberNotFoundError;
        }

        let roleId: number | undefined;
        if (data.role) {
            const foundRoleId = await findRoleByName(data.role);
            if (!foundRoleId) throw RoleNotFoundError;
            roleId = foundRoleId;
        }

        await updateMemberRepo(memberId, { roleId, status: data.status });
    }

    async deleteMember(restaurantId: number, memberId: number) {
        const result = await findMemberWithRoleName(memberId);
        if (!result) throw MemberNotFoundError;

        if (Number(result.member.restaurantId) !== Number(restaurantId)) {
            throw MemberNotFoundError;
        }

        if (result.roleName === 'owner') {
            throw CannotDeleteOwnerError;
        }

        await deleteMemberRepo(memberId);
    }

    async updateMemberBranches(restaurantId: number, memberId: number, data: UpdateMemberBranchesDTO) {
        const result = await findMemberWithRoleName(memberId);
        if (!result) throw MemberNotFoundError;

        if (Number(result.member.restaurantId) !== Number(restaurantId)) {
            throw MemberNotFoundError;
        }

        if (result.roleName === 'owner') {
            throw new AppError('Owners have access to all branches', 400);
        }

        await this.validateBranchOwnership(data.branchIds, restaurantId);

        const now = new Date();
        const rows = data.branchIds.map(branchId => new MemberBranch({
            branchId,
            memberId,
            createdAt: now,
        }));
        await setMemberBranches(memberId, rows);
    }

    async getRolePermissions(roleName: string) {
        const permissions = await getPermissionsDetailsByRoleName(roleName);
        return { role: roleName, permissions };
    }
}

export const memberService = new MemberService(new UserService());
