import {IsString, IsNotEmpty, IsIn, IsOptional, IsInt, Min} from "class-validator";
import {ALLOWED_CONTENT_TYPES} from "../consts";

export class CreateUploadUrlDTO {
    @IsString()
    @IsNotEmpty()
    fileName!: string;

    @IsIn(ALLOWED_CONTENT_TYPES)
    contentType!: string;

    // The restaurant whose resource this file belongs to (product image, logo, ...).
    // Required context for admins uploading on behalf of a restaurant; restaurant
    // users always upload for their own restaurant so they may omit it.
    @IsOptional()
    @IsInt()
    @Min(1)
    restaurantId?: number;
}
