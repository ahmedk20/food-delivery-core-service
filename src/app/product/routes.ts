import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import {ProductController} from "./controller/product.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireRestaurantMember, requireBranchAccess, rbac} from "../../lib/auth/rbac";

const ctrl = container.resolve<ProductController>(TOKENS.ProductController);

export const productRouter = Router();

productRouter.get('/restaurants/:restaurantId/categories', ctrl.findCategories);
productRouter.get('/restaurants/:restaurantId/products',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:product", action: "read"}),
    ctrl.findByRestaurant
);
productRouter.get('/branches/:branchId/products', ctrl.findByBranch);
productRouter.get('/products/:id', ctrl.findById);
productRouter.post('/restaurants/:restaurantId/products',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:product", action: "create"}),
    ctrl.create
);
productRouter.patch('/products/:id',
    authenticate,
    requireBranchAccess('branchId'),
    rbac({resource: "core:product", action: "update"}),
    ctrl.update
);
productRouter.delete('/products/:id', authenticate, ctrl.delete);
