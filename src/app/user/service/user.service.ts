import {findUserById, updateUser} from "../repository/users.repo";
import {AuthService} from "../../auth/service/auth.service";
import {UserNotFoundError} from "../errors"
import {User} from "../entity/user.entity";
import {UpdateMeDto} from "../dto/updateme.dto"

export class UserService {

    getByUserId = async (userId: number) => {
        const user = await findUserById(userId);
        if (!user) {
            throw UserNotFoundError();
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            systemRole: user.systemRole,
        };
    }

    updateByUserId = async (userId: number, data: UpdateMeDto) => {
        const user = await updateUser({
            id: userId,
            name: data.name,
            phone: data.phone,
        });
        if (!user) {
            throw UserNotFoundError();
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            systemRole: user.systemRole,
        };
    }
}

export const userService = new UserService();