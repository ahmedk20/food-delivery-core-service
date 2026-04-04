import {SignJWT,jwtVerify,decodeJwt} from "jose";
import { createSecretKey } from 'crypto'
import {env} from "../../../common/config/env";


export interface JwtPayload {
    userId: number
    email: string
    role: string
    [key: string]: unknown

}

export async function createAccessToken(payload:JwtPayload): Promise<string> {
    const secret = env.jwt.accessSecret
    const secretKey =  createSecretKey(secret,'utf-8')

    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(env.jwt.accessExpiresIn)
        .sign(secretKey)


}

export async function createRefreshToken(payload:JwtPayload): Promise<string> {
    const secret = env.jwt.refreshSecret
    const secretKey =  createSecretKey(secret,'utf-8')

    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(env.jwt.refreshExpiresIn)
        .sign(secretKey)
}


export async function verifyToken (token:string): Promise<JwtPayload> {
    const secret = env.jwt.accessSecret
    const secretKey =  createSecretKey(secret,'utf-8')
    const {payload} = await jwtVerify(token,secretKey);

    return {
        userId:payload.userId as number,
        email:payload.email as string,
        role:payload.role as string,

    } as JwtPayload
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
    const secret = env.jwt.refreshSecret;
    const secretKey = createSecretKey(secret, 'utf-8');
    const { payload } = await jwtVerify(token, secretKey);

    return {
        userId: payload.userId as number,
        email: payload.email as string,
        role: payload.role as string,
    } as JwtPayload;
}

export { decodeJwt };



