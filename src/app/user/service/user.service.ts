import {findUserById} from "../repository/users.repo";
import {AuthService} from "../../auth/service/auth.service";
import {UserNotFoundError} from "../errors"

export class UserService {

    getByUserId=async function  (userId: number) {
      const user  = await findUserById(userId);
      if (!user) {
          throw UserNotFoundError
      }
      return{
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          systemRole: user.systemRole,
      }
    }
}

export const userService = new UserService();