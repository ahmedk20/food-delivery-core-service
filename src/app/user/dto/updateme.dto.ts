import {IsOptional, IsString, MaxLength, MinLength} from "class-validator";

export class UpdateMeDto {
    @IsOptional()
    @MinLength(10)
    @MaxLength(11)
    phone?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;
}