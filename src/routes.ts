import {Router} from "express";
import {healthRouter} from "./app/health/health.routes.js";
import {authRouter} from "./app/auth/routes";
import {userRouter} from "./app/user/routes";
import {customerRouter} from "./app/customer/routes";

export const routes = Router();
routes.use("/health", healthRouter);

routes.use("/auth", authRouter);
routes.use("/user", userRouter);
routes.use("/customer", customerRouter);

