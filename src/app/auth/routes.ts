import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import {AuthController} from "./controller/auth.controller";
import {idempotency} from "../../lib/http/idempotency";

const ctrl = container.resolve<AuthController>(TOKENS.AuthController);

export const authRouter = Router()

authRouter.post('/register', idempotency(), ctrl.register)
authRouter.post('/login', ctrl.login)
authRouter.post('/refresh', ctrl.refresh);
authRouter.post('/logout', ctrl.logout);
authRouter.post('/forget-password', ctrl.forgetPassword);
authRouter.post('/reset-password', ctrl.resetPassword);
