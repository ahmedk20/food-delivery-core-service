import {findUserById, updateUser, findUserExistsByEmailOrPhone, createUser} from "../repository/users.repo";
import {UserNotFoundError} from "../errors"
import {User} from "../entity/user.entity";
import {UpdateMeDto} from "../dto/updateme.dto"
import {hashPassword} from "../../auth/utils/password.util";
import {SystemRole} from "../enums";
import {UserAlreadyExists} from "../../auth/errors";
import {Knex} from "knex";

export interface CreateUserData {
    email: string;
    phone: string;
    name: string;
    password: string;
    systemRole: SystemRole;
}

export class UserService {

    create = async (data: CreateUserData, trx?: Knex): Promise<User> => {
        const exists = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if (exists) {
            throw UserAlreadyExists();
        }
        const passwordHash = data.password ? await hashPassword(data.password) : '';
        return createUser({
            email: data.email,
            phone: data.phone,
            name: data.name,
            passwordHash,
            systemRole: data.systemRole,
        }, trx);
    }

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