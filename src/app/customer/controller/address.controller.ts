import { Request, Response, NextFunction } from "express";
import { AddressService } from "../service/address.service";
import { validateBody } from "../../../lib/validation/validate";
import { CreateAddressDto, UpdateAddressDto } from "../dto/address.dto";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";

@injectable()
export class AddressController {
    constructor(@inject(TOKENS.AddressService) private readonly addressService: AddressService) {}

    getAddresses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addresses = await this.addressService.getAddresses(req.user?.userId!);
            sendSuccess(res, addresses);
        } catch (err) {
            next(err);
        }
    }

    addAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = await validateBody(CreateAddressDto, req.body);
            const address = await this.addressService.addAddress(req.user?.userId!, dto);
            sendSuccess(res, { message: 'Address added', address }, 201);
        } catch (err) {
            next(err);
        }
    }

    updateAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            const dto = await validateBody(UpdateAddressDto, req.body);
            const address = await this.addressService.updateAddress(req.user?.userId!, addressId, dto);
            sendSuccess(res, { message: 'Address updated', address });
        } catch (err) {
            next(err);
        }
    }

    deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            await this.addressService.deleteAddress(req.user?.userId!, addressId);
            sendSuccess(res, { message: 'Address deleted' });
        } catch (err) {
            next(err);
        }
    }
}
