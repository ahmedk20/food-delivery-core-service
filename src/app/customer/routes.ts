import { Router } from "express";
import { addressController } from "./controller/address.controller";
import { authenticate } from "../../common/auth/guard";

export const customerRouter = Router();

customerRouter.get('/addresses', authenticate, addressController.getAddresses);
customerRouter.post('/addresses', authenticate, addressController.addAddress);
customerRouter.patch('/addresses/:addressId', authenticate, addressController.updateAddress);
customerRouter.delete('/addresses/:addressId', authenticate, addressController.deleteAddress);
