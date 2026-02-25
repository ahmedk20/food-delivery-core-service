import {LoginDTO, RegisterDTO,ForgetPasswordDTO,ResetPasswordDTO} from "../dto/auth.dto";
import {findUserByEmail, findUserExistsByEmailOrPhone,createUser,updateUserPassword} from "../../user/repository/users.repo";
import {UserAlreadyExists, CannotSignAsSystemAdmin, IncorrectCredentials,InvalidOTPError} from "../errors";
import {env} from "../../../common/config/env";
import {comparePassword, hashPassword,generateOTP,hashOTP,saveTiming} from "../utils/password.util";
import {User} from "../../user/entity/user.entity";
import {createPasswordReset,findLatestPasswordResetByUserId,updatePasswordResetConsumedAt} from "../repository/password-reset.repo"
import {SystemRole} from "../../user/enums";
import {createAccessToken,createRefreshToken} from "../utils/jwt.util";
import type {JwtPayload} from "../utils/jwt.util";

export class AuthService{
    register = async (data:RegisterDTO)=>{

        if (data.role==SystemRole.SYSTEM_ADMIN){
            throw CannotSignAsSystemAdmin
        }
        const existing :boolean = await findUserExistsByEmailOrPhone(data.email, data.phone);
       if(existing){
           throw  UserAlreadyExists
       }
        const hashedPassword = await hashPassword(data.password)

        const user:User = await createUser({
            email: data.email,
            phone: data.phone,
            name: data.name,
            passwordHash: hashedPassword,
            systemRole:data.role,
        })

       const payload:JwtPayload = {userId: user.id, role: data.role, email: user.email}
       const accessToken = await createAccessToken(payload)
       const refreshToken = await createRefreshToken(payload)

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
           throw IncorrectCredentials
       }
        // compare passwords
       const match = await comparePassword(data.password,user.passwordHash);
        // if passwords doesnt match throw err
       if(!match){
           throw IncorrectCredentials
       }
        // generate tokens
       const payload ={userId: user.id,email:user.email,role: user.systemRole};
       const accessToken = await createAccessToken(payload);
       const refreshToken = await createRefreshToken(payload);

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
            throw InvalidOTPError
        }
        // find reset password
        const reset = await findLatestPasswordResetByUserId(user.id);
        console.log(reset)
        if(!reset) {
            throw InvalidOTPError
        }
        // verify otp and expiry date
        const inputOTPHash = hashOTP(data.otp)
        console.log(inputOTPHash);
        console.log(reset.otpHash);

        console.log(reset.isExpired());
        const isMatch =  saveTiming(inputOTPHash,reset.otpHash);
        if(!isMatch || reset.isExpired() ) {
            throw InvalidOTPError
        }
        // update user password
        const hashedPassword = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, hashedPassword);
        // update reset password
        await updatePasswordResetConsumedAt(reset.id)
    }

}

export const authService = new AuthService();