import {Router} from "express";
import {authenticate} from "../../common/auth/guard";
import {requireRestaurantMember, rbac} from "../../common/auth/rbac";
import {memberController} from "./controller/member.controller";

export const rbacRouter = Router();

rbacRouter.get('/roles/:role/permissions', memberController.getRolePermissions);

rbacRouter.post('/restaurants/:restaurantId/members',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'create'}),
    memberController.createMember
);

rbacRouter.get('/restaurants/:restaurantId/members',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'read'}),
    memberController.listMembers
);

rbacRouter.patch('/restaurants/:restaurantId/members/:memberId',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'update'}),
    memberController.updateMember
);

rbacRouter.delete('/restaurants/:restaurantId/members/:memberId',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'delete'}),
    memberController.deleteMember
);

rbacRouter.put('/restaurants/:restaurantId/members/:memberId/branches',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:member", action: 'update'}),
    memberController.updateMemberBranches
);
