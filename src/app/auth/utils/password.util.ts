import bcrypt from "bcrypt"
import {env} from "../../../common/config/env";
import crypto,{ timingSafeEqual } from "crypto";


export async function hashPassword(password: string): Promise<string> {
    const saltRounds:number = env.jwt.saltRounds || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    return hashedPassword;
}

export async function comparePassword(passwordInput:string,hashedPassword:string):Promise<boolean> {
return bcrypt.compare(passwordInput,hashedPassword);
}

export function generateOTP(): string {
    return crypto.randomInt(100000,999999).toString()
}

export function hashOTP(otp: string) {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

export function saveTiming(inputOtp: string,hashedOtp:string) {
return timingSafeEqual(
    Buffer.from(inputOtp),
    Buffer.from(hashedOtp)
);
}

