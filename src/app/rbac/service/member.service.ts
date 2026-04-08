import {db} from "../../../common/knex/knex";
import {toMs} from "../../../common/utils/time";
import {UserAlreadyExistsError} from "../../auth/errors";
import {createPasswordReset} from "../../auth/repository/password-reset.repo";
import {generateOTP, hashOTP} from "../../auth/utils";
import {SystemRole} from "../../user/enums";
import {findUserByEmail, createUser} from "../../user/repository/users.repo";
import {CreateMemberDTO} from "../dto/member.dto";
import {MemberBranch} from "../entity/member-branch.entity";
import {MemberStatus} from "../enums";
import {CannotCreateOwnerUserError, RoleNotFoundError} from "../errors";
import {setMemberBranches} from "../repository/member-branch.repo";
import {createRestaurantMember} from "../repository/restaurant_member.repo";
import {findRoleByName} from "../repository/role.repo";

export class MemberService{
    async createMember(restaurantId: number, data: CreateMemberDTO){
        // dont accept owner role creation
        if(data.role == 'owner') {
            throw CannotCreateOwnerUserError
        }
        // check if user alr exists
        const existingUser = await findUserByEmail(data.email);
        if(existingUser){
            throw UserAlreadyExistsError
        }

        // find roleId by role name
        const roleId = await findRoleByName(data.role);
        if(!roleId){
            throw RoleNotFoundError
        }
        // create user, member, assign branches
        const trx = await db.transaction();
        try {
            const now = new Date();
            const user = await createUser({
                email: data.email,
                name: data.name,
                phone: data.phoneNumber,
                passwordHash: '',
                systemRole: SystemRole.RESTAURANT_USER,
                createdAt: now,
                updatedAt: now,
            }, trx);

            const member = await createRestaurantMember(
                {
                    restaurantId,
                    userId: user.id,
                    roleId,
                    createdAt: now,
                    updatedAt: now,
                    status: MemberStatus.INACTIVE
                }, trx
            )
            // check that those branches belong to that restaurant
            const rows = data.branchIds.map(branchId => new MemberBranch({
                branchId: branchId,
                memberId: member.id,
                createdAt: now,
            }))
            await setMemberBranches(member.id, rows, trx)

            // generate otp, create password reset record and send email
            // generate an otp
            const otp = generateOTP();
            // hash the otp
            const hashedOtp = hashOTP(otp);
            // insert the otp
            await createPasswordReset({
                    userId: user.id,
                    otpHash: hashedOtp,
                    expiresAt: new Date(Date.now() + toMs(1, 'h')),
                    createdAt: new Date(),
                }, trx
            )
            // TODO: send email
            console.log(`mocked email sent ${otp}`)

            await trx.commit()
        }
        catch (err) {
            await trx.rollback();
            throw err;
        }
    }
}

export const memberService = new MemberService();