import Redis from "ioredis";
import { env } from "../config/env";

const redis = new Redis(env.redis.url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
});

redis.on("error", (err) => {
    console.warn("[Redis] connection error:", err.message);
});

export async function cacheGet(key: string): Promise<string | null> {
    return redis.get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, value);
}

export async function cacheDel(key: string): Promise<void> {
    await redis.del(key);
}
