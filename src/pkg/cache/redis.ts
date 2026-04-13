import Redis from 'ioredis';
import type {ICacheProvider} from "./cache.interface";


export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
}

export class RedisCacheProvider implements ICacheProvider {
    private readonly client: Redis;
    constructor(private readonly config: RedisConfig) {
        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
        });

        this.client.on('error', (err) => {
            console.error('Redis error:', err);
        });

        this.client.connect().catch((err) => {
            console.error('Redis connection error:', err);
        })
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttl: number): Promise<void> {
        await this.client.setex(key, ttl, value);
    }

}
