import {NextFunction, Request, Response} from "express";
import {NotAuthenticated} from "./errors";
import {verifyToken} from "../../app/auth/utils/jwt.util";

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token =
            req.cookies.access_token ??
            req.headers.authorization?.replace(/^Bearer\s+/i, '');

        if (!token) {
            throw NotAuthenticated;
        }

        const payload = await verifyToken(token);
        req.user = payload;

        next();
    } catch (err) {
        next(err);
    }
}