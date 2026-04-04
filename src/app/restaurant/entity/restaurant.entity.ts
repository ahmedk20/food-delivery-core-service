import {RestaurantStatus} from "../enums";
export class RestaurantEntity {
    id: number;
    ownerId: number;
    name: string;
    logoUrl: string;
    primaryCountry: string;
    status: RestaurantStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    statusUpdatedAt: Date;
    constructor(data: Partial<RestaurantEntity>) {
        this.id = data.id!;
        this.ownerId = data.ownerId!;
        this.name = data.name!;
        this.logoUrl = data.logoUrl!;
        this.primaryCountry = data.primaryCountry!;
        this.status = data.status!;
        this.createdAt = data.createdAt??new Date();
        this.updatedAt = data.updatedAt??new Date();
        this.deletedAt = data.deletedAt ?? null;
        this.statusUpdatedAt = data.statusUpdatedAt ?? new Date();
    }


}