import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

const stage = process.env.APP_STAGE || 'dev';
const rootPath = path.resolve(__dirname, '../../../');

if (stage === 'dev') {
    config({ path: path.join(rootPath, '.env.dev') });
} else if (stage === 'test') {
    config({ path: path.join(rootPath, '.env.test') });
} else {
    config({ path: path.join(rootPath, '.env') });
}

const envSchema = z.object({
    APP_STAGE: z.enum(['dev', 'production', 'test']).default('dev'),
    PORT:      z.coerce.number().positive().default(3001),
    HOST:      z.string().default('localhost'),
    APP_BASE_URL: z.string().url(),

    REGIONS: z.string().min(1),

    DB_POOL_MIN: z.coerce.number().min(0).default(2),
    DB_POOL_MAX: z.coerce.number().positive().default(10),

    REDIS_HOST:     z.string().default('localhost'),
    REDIS_PORT:     z.coerce.number().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    ACCESS_SECRET:       z.string().min(1),
    CORE_SERVICE_URL:    z.string().url(),
    INTERNAL_HMAC_SECRET: z.string().min(1),

    KASHIER_MERCHANT_ID:    z.string().min(1),
    KASHIER_API_KEY:        z.string().min(1),
    KASHIER_WEBHOOK_SECRET: z.string().min(1),
    KASHIER_BASE_URL:       z.string().url(),
    KASHIER_RETURN_URL:     z.string().url(),
    KASHIER_FAIL_URL:       z.string().url(),

    CORS_ORIGINS: z.string().default('http://localhost:5173'),

    RABBITMQ_URL: z.string().min(1),

    ASSIGNMENT_RADIUS_METERS:  z.coerce.number().positive().default(5000),
    AGENT_ACCEPT_TIMEOUT_SEC:  z.coerce.number().positive().default(30),
    MAX_REASSIGNMENT_ATTEMPTS: z.coerce.number().positive().default(3),
    AGENT_SHARE_RATE:          z.coerce.number().min(0).max(1).default(1.0),

    PAYMENT_SESSION_TIMEOUT_MIN: z.coerce.number().positive().default(15),
    PRESENCE_STALE_SEC:          z.coerce.number().positive().default(90),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

const data = parsed.data;
const regions = data.REGIONS.split(',').map(r => r.trim()).filter(Boolean);

// Validate per-region DB vars early so we fail at boot, not at first query.
for (const region of regions) {
    for (const key of ['HOST', 'PORT', 'NAME', 'USER']) {
        if (!process.env[`DB_${region}_${key}`]) {
            console.error(`Missing required env var: DB_${region}_${key}`);
            process.exit(1);
        }
    }
}

export const env = {
    appStage:   data.APP_STAGE,
    port:       data.PORT,
    host:       data.HOST,
    appBaseUrl: data.APP_BASE_URL,
    regions,

    db: {
        poolMin:            data.DB_POOL_MIN,
        poolMax:            data.DB_POOL_MAX,
        migrationDirectory: path.resolve(rootPath, 'src/database/migrations'),
        migrationExtension: 'ts' as const,
    },

    redis: {
        host:     data.REDIS_HOST,
        port:     data.REDIS_PORT,
        password: data.REDIS_PASSWORD,
    },

    accessSecret:        data.ACCESS_SECRET,
    coreServiceUrl:      data.CORE_SERVICE_URL,
    internalHmacSecret:  data.INTERNAL_HMAC_SECRET,

    kashier: {
        merchantId:    data.KASHIER_MERCHANT_ID,
        apiKey:        data.KASHIER_API_KEY,
        webhookSecret: data.KASHIER_WEBHOOK_SECRET,
        baseUrl:       data.KASHIER_BASE_URL,
        returnUrl:     data.KASHIER_RETURN_URL,
        failUrl:       data.KASHIER_FAIL_URL,
    },

    cors: {
        origins: data.CORS_ORIGINS.split(',').map(o => o.trim()),
    },

    rabbitmq: {
        url: data.RABBITMQ_URL,
    },

    delivery: {
        assignmentRadiusMeters:  data.ASSIGNMENT_RADIUS_METERS,
        agentAcceptTimeoutSec:   data.AGENT_ACCEPT_TIMEOUT_SEC,
        maxReassignmentAttempts: data.MAX_REASSIGNMENT_ATTEMPTS,
        agentShareRate:          data.AGENT_SHARE_RATE,
    },

    payment: {
        sessionTimeoutMin: data.PAYMENT_SESSION_TIMEOUT_MIN,
    },

    agent: {
        presenceStaleSec: data.PRESENCE_STALE_SEC,
    },
};
