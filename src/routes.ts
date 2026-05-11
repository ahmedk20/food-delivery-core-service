import {Router} from "express";
import {healthRouter} from "./app/health/health.routes.js";
import {authRouter} from "./app/auth/routes";
import {userRouter} from "./app/user/routes";
import {customerRouter} from "./app/customer/routes";
import { restaurantRouter } from "./app/restaurant/routes";
import { branchRouter } from "./app/branch/routes";
import { productRouter } from "./app/product/routes";
import { rbacRouter } from "./app/member/routes";
import { internalRouter } from "./app/internal/routes.js";

export const routes = Router();
routes.use("/health", healthRouter);
routes.use("/internal", internalRouter);

routes.use("/auth", authRouter);
routes.use("/user", userRouter);
routes.use("/customer", customerRouter);
routes.use("/restaurant", restaurantRouter);

routes.use("/", branchRouter);
routes.use("/", productRouter);

routes.use("/", rbacRouter);

