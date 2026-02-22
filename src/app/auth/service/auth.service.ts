import {RegisterDTO} from "../dto/auth.dto";
import { findUserExistsByEmailOrPhone} from "../../user/repository/users.repo";
import {UserAlreadyExists,CannotSignAsSystemAdmin} from "../errors";
import {env} from "../../../common/config/env";
import {hashPassword} from "../utils/password.util";
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
}

export const authService = new AuthService();