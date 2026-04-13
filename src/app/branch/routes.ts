import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import {BranchController} from "./controller/branch.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireRestaurantMember, requireBranchAccess, rbac} from "../../lib/auth/rbac";
import {idempotency} from "../../lib/http/idempotency";

const ctrl = container.resolve<BranchController>(TOKENS.BranchController);

export const branchRouter = Router();

branchRouter.get('/branches/nearby', ctrl.findNearby)
branchRouter.get('/restaurants/:restaurantId/branches', ctrl.findByRestaurant)
branchRouter.post('/restaurants/:restaurantId/branches',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:branch", action: "create"}),
    idempotency(),
    ctrl.create
)
branchRouter.patch('/branches/:id',
    authenticate,
    requireBranchAccess('id'),
    rbac({resource: "core:branch", action: "update"}),
    ctrl.update
)
branchRouter.patch('/branches/:id/status', authenticate, ctrl.updateStatus)
