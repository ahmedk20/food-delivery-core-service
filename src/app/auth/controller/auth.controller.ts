import {authService, AuthService} from "../service/auth.service";
import {Request,Response,NextFunction} from "express";
import {validateBody} from "../../../common/validation/validate";
import {LoginDTO, RegisterDTO,ForgetPasswordDTO,ResetPasswordDTO} from "../dto/auth.dto";
import {setAuthCookies} from "../../../common/auth/set-auth-cookies";

export class AuthController {
    constructor(private readonly authService: AuthService) {

    }
    register = async(req: Request, res: Response, next: NextFunction) => {
        try{
            // 1. validate req.body
            const data = await validateBody(RegisterDTO, req.body);
            // 2. call service
            const result = await this.authService.register(data);
            setAuthCookies(res,result.accessToken, result.refreshToken);

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
            setAuthCookies(res,result.accessToken, result.refreshToken);

            res.status(200).json(result);
        }catch(err) {
            next(err);
        }
    }


    forgetPassword = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ForgetPasswordDTO, req.body);
            await this.authService.forgetPassword(data);
            res.status(200).json({
                "message": "Email Sent with OTP",
            })
        }
        catch(err) {
            next(err);
        }
    }


    resetPassword = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.resetPassword(data);
            res.status(200).json({
                "message": "Password reset successfully, please login again",
            })
        }
        catch(err) {
            next(err);
        }
    }

}

export const authController = new AuthController(authService);