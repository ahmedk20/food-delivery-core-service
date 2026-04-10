import { Router } from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import {AddressController} from "./controller/address.controller";
import { authenticate } from "../../lib/auth/guard";

const ctrl = container.resolve<AddressController>(TOKENS.AddressController);

export const customerRouter = Router();

customerRouter.get('/addresses', authenticate, ctrl.getAddresses);
customerRouter.post('/addresses', authenticate, ctrl.addAddress);
customerRouter.patch('/addresses/:addressId', authenticate, ctrl.updateAddress);
customerRouter.delete('/addresses/:addressId', authenticate, ctrl.deleteAddress);
