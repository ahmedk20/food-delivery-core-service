import { Request, Response, NextFunction } from "express";
import { addressService, AddressService } from "../service/address.service";
import { validateBody } from "../../../common/validation/validate";
import { CreateAddressDto, UpdateAddressDto } from "../dto/address.dto";

export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    getAddresses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.addressService.getAddresses(req.user?.userId!);
            res.status(200).json({ data });
        } catch (err) {
            next(err);
        }
    }

    addAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = await validateBody(CreateAddressDto, req.body);
            const address = await this.addressService.addAddress(req.user?.userId!, dto);
            res.status(201).json({ message: 'Address added', address });
        } catch (err) {
            next(err);
        }
    }

    updateAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            const dto = await validateBody(UpdateAddressDto, req.body);
            const address = await this.addressService.updateAddress(req.user?.userId!, addressId, dto);
            res.status(200).json({ message: 'Address updated', address });
        } catch (err) {
            next(err);
        }
    }

    deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            await this.addressService.deleteAddress(req.user?.userId!, addressId);
            res.status(200).json({ message: 'Address deleted' });
        } catch (err) {
            next(err);
        }
    }
}

export const addressController = new AddressController(addressService);
