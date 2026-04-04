import { CreateAddressDto, UpdateAddressDto } from "../dto/address.dto";
import {
    findAddressesByUserId,
    findAddressById,
    createAddress,
    clearDefaultAddresses,
    updateAddressById,
    deleteAddressById,
} from "../repository/address.repo";
import { Address } from "../entity/address.entity";
import { AddressNotFound } from "../errors";

function toResponse(address: Address) {
    return {
        id: address.id,
        label: address.label,
        country: address.country,
        city: address.city,
        street: address.street,
        building: address.building,
        apartmentNumber: address.apartmentNumber,
        type: address.type,
        lat: address.lat,
        lng: address.lng,
        isDefault: address.isDefault,
    };
}

export class AddressService {
    getAddresses = async (userId: number) => {
        const addresses = await findAddressesByUserId(userId);
        return addresses.map(toResponse);
    }

    addAddress = async (userId: number, data: CreateAddressDto) => {
        if (data.isDefault) {
            await clearDefaultAddresses(userId);
        }
        const address = await createAddress({ ...data, userId });
        return toResponse(address);
    }

    updateAddress = async (userId: number, addressId: number, data: UpdateAddressDto) => {
        const existing = await findAddressById(addressId);
        if (!existing || existing.userId !== userId) {
            throw AddressNotFound();
        }
        if (data.isDefault) {
            await clearDefaultAddresses(userId);
        }
        const updated = await updateAddressById(addressId, data);
        if (!updated) throw AddressNotFound();
        return toResponse(updated);
    }

    deleteAddress = async (userId: number, addressId: number) => {
        const existing = await findAddressById(addressId);
        if (!existing || existing.userId !== userId) {
            throw AddressNotFound();
        }
        await deleteAddressById(addressId);
    }
}

export const addressService = new AddressService();
c