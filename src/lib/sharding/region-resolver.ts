import { Request, Response, NextFunction } from 'express';
import AppError from '../error/AppError.js';

export function resolveRegion(req: Request, _res: Response, next: NextFunction): void {
    const region = req.headers['x-region'] as string | undefined;
    req.region = region || undefined;
    next();
}

export function requireRegion(req: Request, _res: Response, next: NextFunction): void {
    if (!req.region) {
        return next(new AppError('X-Region header is required', 400));
    }
    next();
}

export function requireConcreteRegion(req: Request, _res: Response, next: NextFunction): void {
    if (!req.region) {
        return next(new AppError('X-Region header is required', 400));
    }
    if (req.region === 'all') {
        return next(new AppError('A concrete region is required for this endpoint', 400));
    }
    next();
}
