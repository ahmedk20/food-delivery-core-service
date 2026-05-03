import type { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../config/env.js';
import AppError from '../error/AppError.js';

export function requireInternalHmac(req: Request, _res: Response, next: NextFunction) {
    const sig = req.headers['x-internal-signature'] as string | undefined;
    const timestamp = req.headers['x-internal-timestamp'] as string | undefined;

    if (!sig || !timestamp) return next(new AppError('Missing internal signature', 401));

    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > 60_000)
        return next(new AppError('Request expired', 401));

    // req.originalUrl includes the full /api/internal/... path — same string the client signed
    const cleanPath = req.originalUrl.split('?')[0];
    const payload = `${timestamp}:${req.method}:${cleanPath}`;
    const expected = createHmac('sha256', env.internalHmacSecret).update(payload).digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const sigBuf = Buffer.from(sig, 'hex');

    if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf))
        return next(new AppError('Invalid internal signature', 401));

    next();
}
