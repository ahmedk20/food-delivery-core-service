import {Router} from "express";
import {authenticate} from "../../common/auth/guard";
import {productController} from "./controller/product.controller";
import {requireRestaurantMember, requireBranchAccess, rbac} from "../../common/auth/rbac";

export const productRouter = Router();

productRouter.get('/restaurants/:restaurantId/categories', productController.findCategories);
productRouter.get('/restaurants/:restaurantId/products',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:product", action: "read"}),
    productController.findByRestaurant
);
productRouter.get('/branches/:branchId/products', productController.findByBranch);
productRouter.get('/products/:id', productController.findById);
productRouter.post('/restaurants/:restaurantId/products',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource: "core:product", action: "create"}),
    productController.create
);
productRouter.patch('/products/:id',
    authenticate,
    requireBranchAccess('branchId'),
    rbac({resource: "core:product", action: "update"}),
    productController.update
);
productRouter.delete('/products/:id', authenticate, productController.delete);
