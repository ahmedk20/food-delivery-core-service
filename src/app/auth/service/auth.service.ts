import {LoginDTO, RegisterDTO} from "../dto/auth.dto";
import {findUserByEmail, findUserExistsByEmailOrPhone} from "../../user/repository/users.repo";
import {UserAlreadyExists, CannotSignAsSystemAdmin, IncorrectCredentials} from "../errors";
import {env} from "../../../common/config/env";
import {comparePassword, hashPassword} from "../utils/password.util";
import {User} from "../../user/entity/user.entity";
import {createUser} from "../../user/repository/users.repo";
import {SystemRole} from "../../user/enums";
import {createAccessToken,createRefreshToken} from "../utils/jwt.util";
import type {JwtPayload} from "../utils/jwt.util";

export class AuthService{
    register = async function(data:RegisterDTO){

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

    login = async function(data:LoginDTO){
        // find the user by email input
       const user = await findUserByEmail(data.email);
       if(!user){
           throw IncorrectCredentials
       }
        // compare passwords
       const match:Promise<boolean> =comparePassword(data.password,user.passwordHash);
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
}

export const authService = new AuthService();