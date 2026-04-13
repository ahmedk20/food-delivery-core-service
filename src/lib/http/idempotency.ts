import {Request, Response, NextFunction} from "express";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";
import {ICacheProvider} from "../../pkg/cache/cache.interface";

const TTL = 86_400; // 24 hours — long enough for any client retry window

interface StoredResponse {
    status: number;
    body: unknown;
}

export function idempotency() {
    // Resolve once outside the handler — same pattern as withCache
    const cache = container.resolve<ICacheProvider>(TOKENS.CacheProvider);

    return async (req: Request, res: Response, next: NextFunction) => {
        const key = req.headers['idempotency-key'] as string | undefined;

        // No key sent → treat as a normal request, no idempotency guarantee
        if (!key) return next();

        const cacheKey = `idempotent:${key}`;

        try {
            const cached = await cache.get(cacheKey);
            if (cached) {
                // We've seen this key before — replay the original response
                const stored: StoredResponse = JSON.parse(cached);
                res.setHeader('X-Idempotency-Replay', 'true');
                return res.status(stored.status).json(stored.body);
            }
        } catch {
            // Redis down → fall through and process normally
            // Non-fatal: better to process twice than to block the request
        }

        // Key is new — intercept res.json to capture the response before it's sent
        const originalJson = res.json.bind(res);
        res.json = function (body: unknown) {
            // Only cache successful responses
            // Don't cache 400/500 — the client should fix the request and retry
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const stored: StoredResponse = {status: res.statusCode, body};
                cache.set(cacheKey, JSON.stringify(stored), TTL).catch(() => {});
            }
            return originalJson(body);
        };

        next();
    };
}
