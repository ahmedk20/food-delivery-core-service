import {AuthService} from "../service/auth.service";
import {Request,Response,NextFunction} from "express";
import {validateBody} from "../../../lib/validation/validate";
import {LoginDTO, RegisterDTO,ForgetPasswordDTO,ResetPasswordDTO} from "../dto/auth.dto";
import {setAuthCookies} from "../../../lib/auth/set-auth-cookies";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";

@injectable()
export class AuthController {
    constructor(@inject(TOKENS.AuthService) private readonly authService: AuthService) {}
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


    refresh = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const rawToken: string | undefined = req.cookies?.refresh_token;
            if (!rawToken) {
                res.status(401).json({ message: 'Invalid or expired refresh token' });
                return;
            }
            const result = await this.authService.refresh(rawToken);
            setAuthCookies(res, result.accessToken, result.refreshToken);
            res.status(200).json({ message: 'Token refreshed' });
        } catch(err) {
            next(err);
        }
    }


    logout = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const rawToken: string | undefined = req.cookies?.refresh_token;
            await this.authService.logout(rawToken);
            res.clearCookie('access_token');
            res.clearCookie('refresh_token', { path: '/api/auth' });
            res.status(200).json({ message: 'Logged out successfully' });
        } catch(err) {
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

