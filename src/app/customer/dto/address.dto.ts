import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum AddressType {
    HOME = 'home',
    OFFICE = 'office',
    PUBLIC_PLACE = 'public_place',
}

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    label!: string;

    @IsString()
    @IsNotEmpty()
    country!: string;

    @IsString()
    @IsNotEmpty()
    city!: string;

    @IsString()
    @IsNotEmpty()
    street!: string;

    @IsOptional()
    @IsString()
    building?: string;

    @IsOptional()
    @IsString()
    apartmentNumber?: string;

    @IsEnum(AddressType)
    type!: AddressType;

    @IsNumber()
    lat!: number;

    @IsNumber()
    lng!: number;

    @IsBoolean()
    isDefault!: boolean;
}

export class UpdateAddressDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    label?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    country?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    city?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    street?: string;

    @IsOptional()
    @IsString()
    building?: string;

    @IsOptional()
    @IsString()
    apartmentNumber?: string;

    @IsOptional()
    @IsEnum(AddressType)
    type?: AddressType;

    @IsOptional()
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
