import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import {MemberController} from "./controller/member.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireRestaurantMember, rbac} from "../../lib/auth/rbac";

const ctrl = container.resolve<MemberController>(TOKENS.MemberController);

export const rbacRouter = Router();

rbacRouter.get('/roles/:role/permissions', ctrl.getRolePermissions);

rbacRouter.post('/restaurants/:restaurantId/members',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'create'}),
    ctrl.createMember
);

rbacRouter.get('/restaurants/:restaurantId/members',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'read'}),
    ctrl.listMembers
);

rbacRouter.patch('/restaurants/:restaurantId/members/:memberId',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'update'}),
    ctrl.updateMember
);

rbacRouter.delete('/restaurants/:restaurantId/members/:memberId',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'delete'}),
    ctrl.deleteMember
);

rbacRouter.put('/restaurants/:restaurantId/members/:memberId/branches',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'update'}),
    ctrl.updateMemberBranches
);
