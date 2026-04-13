import { Router } from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import {RestaurantController} from "./controller/restaurant.controller";
import { authenticate } from "../../lib/auth/guard";
import {requireRestaurantMember, rbac} from "../../lib/auth/rbac";
import {idempotency} from "../../lib/http/idempotency";

const ctrl = container.resolve<RestaurantController>(TOKENS.RestaurantController);

export const restaurantRouter = Router();

restaurantRouter.get('/', ctrl.getAll);
restaurantRouter.post('/', authenticate, idempotency(), ctrl.create);
restaurantRouter.patch('/:id',
    authenticate,
    requireRestaurantMember('id'),
    rbac({resource: "core:restaurant", action: "update"}),
    ctrl.update
);
restaurantRouter.patch('/:id/status', authenticate, ctrl.updateStatus);
