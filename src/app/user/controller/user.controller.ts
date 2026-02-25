import {userService,UserService} from "../service/user.service";
import {Request, Response,NextFunction} from "express";
import {validateBody} from "../../../common/validation/validate";

export class UserController {
    constructor(private readonly userService: UserService) {

    }

    getMe = async(req: Request, res: Response, next : NextFunction) => {
     try {
         const user = await this.userService.getByUserId(req.user?.userId!)
         res.status(200).json(user)

     }catch(err){
         next(err);
     }

    }


}

export const userController = new UserController(userService)