export type AddressType = 'home' | 'office' | 'public_place';

export class Address {
    id: number;
    userId: number;
    label: string;
    country: string;
    city: string;
    street: string;
    building: string | null;
    apartmentNumber: string | null;
    type: AddressType;
    lat: number;
    lng: number;
    isDefault: boolean;

    constructor(data: Partial<Address>) {
        this.id = data.id!;
        this.userId = data.userId!;
        this.label = data.label!;
        this.country = data.country!;
        this.city = data.city!;
        this.street = data.street!;
        this.building = data.building ?? null;
        this.apartmentNumber = data.apartmentNumber ?? null;
        this.type = data.type!;
        this.lat = data.lat!;
        this.lng = data.lng!;
        this.isDefault = data.isDefault!;
    }
}
