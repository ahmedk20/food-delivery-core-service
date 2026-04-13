import {UserService} from "../service/user.service";
import {Request, Response, NextFunction} from "express";
import {validateBody} from "../../../lib/validation/validate";
import {UpdateMeDto} from "../dto/updateme.dto";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";

@injectable()
export class UserController {
    constructor(@inject(TOKENS.UserService) private readonly userService: UserService) {}

    getMe = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await this.userService.getByUserId(req.user?.userId!)
            sendSuccess(res, user);
        } catch(err) {
            next(err);
        }
    }

    updateMe = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateMeDto, req.body);
            const user = await this.userService.updateByUserId(req.user?.userId!, data);
            sendSuccess(res, { message: 'Profile updated', user });
        } catch(err) {
            next(err);
        }
    }
}
