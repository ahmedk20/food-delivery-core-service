import bcrypt from "bcrypt"
import {env} from "../../../common/config/env";

export async function hashPassword(password: string): Promise<string> {
    const saltRounds:number = env.jwt.saltRounds || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    return hashedPassword;
}
