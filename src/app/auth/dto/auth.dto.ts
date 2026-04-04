import {
    IsEmail,
    MinLength,
    IsString,
    IsStrongPassword,
    MaxLength,
    IsEnum,
    IsNotEmpty,
    IsOptional, ValidateNested,

} from "class-validator";
import {SystemRole} from "../../user/enums";

export class RegisterDTO {
    @IsEmail()
    email!: string;

    @MinLength(10)
    @MaxLength(11)
    phone!: string;

    @IsString()
    @MinLength(1)
    name!: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,

    }, {
        message: 'Password is not strong enough. It must contain at least 8 characters, one uppercase letter, one lowercase letter, one number.',
    })
    password!: string;

    @IsEnum(SystemRole)
    role!: SystemRole;
    @IsOptional()
    @Type(()=> RegisterRestaurantDTO)
    @ValidateNested()
    restaurant?: RegisterRestaurantDTO;

}

export class LoginDTO {
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}

export class ForgetPasswordDTO {
    @IsEmail()
    email!: string;
}

export class ResetPasswordDTO {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(6)
    otp!: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,

    }, {
        message: 'Password is not strong enough. It must contain at least 8 characters, one uppercase letter, one lowercase letter, one number.',
    })
    newPassword!: string;

}


export class RegisterRestaurantDTO {
    @IsString()
    @MinLength(1)
    name!: string;

    @IsOptional()
    @IsString()
    logoURL?: string;

    @IsString()
    @MinLength(1)
    primaryCountry!: string;
}