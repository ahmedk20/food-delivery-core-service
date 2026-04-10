import {container} from 'tsyringe';
import {TOKENS} from "./tokens";
import {Logger} from "../logger/logger";

// @ts-ignore
container.registerSingleton(TOKENS.Logger, Logger);

import {AuthService} from "../../app/auth/service/auth.service";
import {UserService} from "../../app/user/service/user.service";
import {ProductService} from "../../app/product/service/product.service";
import {MemberService} from "../../app/rbac/service/member.service";
import {RestaurantService} from "../../app/restaurant/service/restaurant.service";
import {BranchService} from "../../app/branch/service/branch.service";
import {AddressService} from "../../app/customer/service/address.service";
import {PermissionCacheService} from "../../app/rbac/service/permission-cache.service";

import {AuthController} from "../../app/auth/controller/auth.controller";
import {UserController} from "../../app/user/controller/user.controller";
import {ProductController} from "../../app/product/controller/product.controller";
import {MemberController} from "../../app/rbac/controller/member.controller";
import {RestaurantController} from "../../app/restaurant/controller/restaurant.controller";
import {BranchController} from "../../app/branch/controller/branch.controller";
import {AddressController} from "../../app/customer/controller/address.controller";


container.registerSingleton(TOKENS.AuthService, AuthService);
container.registerSingleton(TOKENS.UserService, UserService);
container.registerSingleton(TOKENS.ProductService, ProductService);
container.registerSingleton(TOKENS.MemberService, MemberService);
container.registerSingleton(TOKENS.BranchService, BranchService);
container.registerSingleton(TOKENS.RestaurantService, RestaurantService);
container.registerSingleton(TOKENS.AddressService, AddressService);
container.registerSingleton(TOKENS.PermissionCacheService, PermissionCacheService);


container.registerSingleton(TOKENS.AuthController, AuthController);
container.registerSingleton(TOKENS.UserController, UserController);
container.registerSingleton(TOKENS.ProductController, ProductController);
container.registerSingleton(TOKENS.MemberController, MemberController);
container.registerSingleton(TOKENS.BranchController, BranchController);
container.registerSingleton(TOKENS.RestaurantController, RestaurantController);
container.registerSingleton(TOKENS.AddressController, AddressController);

export { container}

