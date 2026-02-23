import {authService, AuthService} from "../service/auth.service";
import {Request,Response,NextFunction} from "express";
import {validateBody} from "../../../common/validation/validate";
import {LoginDTO, RegisterDTO} from "../dto/auth.dto";

export class AuthController {
    constructor(private readonly authService: AuthService) {

    }
    register = async(req: Request, res: Response, next: NextFunction) => {
        try{
            // 1. validate req.body
            const data = await validateBody(RegisterDTO, req.body);
            // 2. call service
            const result = await this.authService.register(data);
            // 3. respond
            res.status(201).json(result);
        } catch(err) {
            next(err);
        }
    }


    login = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(LoginDTO, req.body);
            const result = await this.authService.login(data);
            res.status(200).json(result);
        }catch(err) {
            next(err);
        }
    }
}

export const authController = new AuthController(authService);