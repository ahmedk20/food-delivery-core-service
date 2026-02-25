import {Router} from "express";
import {healthRouter} from "./app/health/health.routes.js";
import {authRouter} from "./app/auth/routes";
import {userRouter} from "./app/user/routes";

export const routes = Router();
routes.use("/health", healthRouter);

routes.use("/auth",authRouter);
routes.use("/user",userRouter)

