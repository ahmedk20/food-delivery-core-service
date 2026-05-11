import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import {UserController} from "./controller/user.controller";
import {authenticate} from "../../lib/auth/guard";

const ctrl = container.resolve<UserController>(TOKENS.UserController);

export const userRouter = Router();

userRouter.get('/me', authenticate, ctrl.getMe);
userRouter.patch('/me', authenticate, ctrl.updateMe);
