import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';

process.env.APP_STAGE = process.env.APP_STAGE || 'dev';

const isProduction = process.env.APP_STAGE === 'production';
const isDevelopment = process.env.APP_STAGE === 'dev';
const isTest = process.env.APP_STAGE === 'test';

// Load correct env file based on stage (always from project root)
const rootPath = path.resolve(__dirname, '../../../');

if (isDevelopment) {
    config({ path: path.join(rootPath, '.env.dev') });
} else if (isTest) {
    config({ path: path.join(rootPath, '.env.test') });
} else {
    config({ path: path.join(rootPath, '.env') });
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_STAGE: z.enum(['dev', 'production', 'test']).default('dev'),

    PORT: z.coerce.number().positive().default(3000),
    HOST: z.string().default('localhost'),

    DB_URL: z.string().startsWith('postgresql://'),
    DB_POOL_MIN: z.coerce.number().min(0).default(2),
    DB_POOL_MAX: z.coerce.number().positive().default(10),
    DB_MIGRATION_DIRECTORY: z.string().default('src/database/migrations'),
    DB_MIGRATION_EXTENSION: z.string().default('ts'),


    REDIS_URL: z.string().default('redis://localhost:6379'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    ACCESS_SECRET: z.string(),
    REFRESH_SECRET: z.string(),
    ACCESS_EXPIRES_IN: z.string(),
    REFRESH_EXPIRES_IN: z.string(),
    BCRYPT_SALT_ROUNDS:  z.coerce.number().min(4).max(15),

    CORS_ORIGINS: z.string().default("*"),

    INTERNAL_HMAC_SECRET: z.string().min(1),

    EMAIL_HOST:     z.string().default('smtp.mailtrap.io'),
    EMAIL_PORT:     z.coerce.number().positive().default(587),
    EMAIL_USER:     z.string().default(''),
    EMAIL_PASSWORD: z.string().default(''),
    EMAIL_FROM:     z.string().default('Food Delivery <noreply@fooddelivery.com>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables');
    console.error(parsed.error.format());
    process.exit(1);
}

const data = parsed.data;

export const env = {
    NODE_ENV: data.NODE_ENV || 'development',
    port: data.PORT,
    host: data.HOST,

    redis: {
        url: data.REDIS_URL,
        host: data.REDIS_HOST,
        password: data.REDIS_PASSWORD,
        port: data.REDIS_PORT,
    },

    db: {
        url: data.DB_URL,
        poolMin: data.DB_POOL_MIN,
        poolMax: data.DB_POOL_MAX,
    // Ensure we always treat DB_MIGRATION_DIRECTORY as a path under the project root,
    // even if the env var starts with a leading slash like "/src/..."
    migrationDirectory: path.resolve(
      __dirname,
      '../../../',
      data.DB_MIGRATION_DIRECTORY.replace(/^\/+/, '')
    ),
        migrationExtension: data.DB_MIGRATION_EXTENSION,
    },
    jwt:{
        refreshSecret: data.REFRESH_SECRET,
        accessSecret: data.ACCESS_SECRET,
        accessExpiresIn: data.ACCESS_EXPIRES_IN,
        refreshExpiresIn: data.REFRESH_EXPIRES_IN,
        saltRounds: data.BCRYPT_SALT_ROUNDS,

    }
    ,
    cors: {
        origins: data.CORS_ORIGINS.split(',').map(origin => origin.trim()),
    },

    internalHmacSecret: data.INTERNAL_HMAC_SECRET,

    email: {
        host:     data.EMAIL_HOST,
        port:     data.EMAIL_PORT,
        user:     data.EMAIL_USER,
        password: data.EMAIL_PASSWORD,
        from:     data.EMAIL_FROM,
    },
};
