import {Request, Response, NextFunction} from "express";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";
import crypto from "crypto";
import {ICacheProvider} from "../../pkg/cache/cache.interface";

export function withCache(ttl = 3600, userScoped = false) {
    const cache = container.resolve<ICacheProvider>(TOKENS.CacheProvider);

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const base = `cache:${req.method}:${req.path}`;

            const allowedParams = ["page", "limit", "search"];
            const sortedQuery = Object.keys(req.query)
                .filter((k) => allowedParams.includes(k))
                .sort()
                .map((k) => `${k}=${req.query[k]}`)
                .join("&");

            const queryHash = sortedQuery
                ? crypto.createHash("sha1").update(sortedQuery).digest("hex")
                : "";

            let key = queryHash ? `${base}:${queryHash}` : base;

            if (userScoped && req.user?.userId) {
                key = `${key}:u:${req.user.userId}`;
            }

            const cached = await cache.get(key);
            if (cached) {
                res.setHeader("X-Cache", "HIT");
                return res.json(JSON.parse(cached));
            }

            const originalJson = res.json.bind(res);
            res.json = function (body: unknown) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache.set(key, JSON.stringify(body), ttl).catch(() => {});
                }
                res.setHeader("X-Cache", "MISS");
                return originalJson(body);
            };

            next();
        } catch (e) {
            next(e);
        }
    };
}
