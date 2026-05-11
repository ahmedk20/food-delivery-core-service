import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { SystemRole } from './roles.js';
import { NotAuthenticated, NotAuthorized } from './errors.js';

const accessSecret = new TextEncoder().encode(env.accessSecret);

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const token = req.cookies?.access_token as string | undefined;
        if (!token) return next(NotAuthenticated);

        const { payload } = await jwtVerify(token, accessSecret);

        req.user = {
            userId:        payload.userId as number,
            role:          payload.role as SystemRole,
            countryCode:   payload.countryCode as string,
            restaurantId:  payload.restaurantId  as number | undefined,
            restaurantRole: payload.restaurantRole as string | undefined,
            branchIds:     payload.branchIds as number[] | undefined,
        };

        next();
    } catch {
        next(NotAuthenticated);
    }
}

export function requireRole(role: SystemRole) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) return next(NotAuthenticated);
        if (req.user.role !== role) return next(NotAuthorized);
        next();
    };
}

export function requireSystemAdmin() {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) return next(NotAuthenticated);
        if (req.user.role !== SystemRole.SYSTEM_ADMIN) return next(NotAuthorized);
        next();
    };
}

export function requireRestaurantMember() {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) return next(NotAuthenticated);
        if (req.user.role === SystemRole.SYSTEM_ADMIN) return next();
        if (!req.user.restaurantId) return next(NotAuthorized);
        next();
    };
}
