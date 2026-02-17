import { config } from 'dotenv';
import { z } from 'zod';

process.env.APP_STAGE = process.env.APP_STAGE || 'dev';

const isProduction = process.env.APP_STAGE === 'production';
const isDevelopment = process.env.APP_STAGE === 'dev';
const isTest = process.env.APP_STAGE === 'test';

// Load correct env file based on stage
if (isDevelopment) {
    config({ path: '.env.dev' });
} else if (isTest) {
    config({ path: '.env.test' });
} else {
    config({ path: '.env' });
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_STAGE: z.enum(['dev', 'production', 'test']).default('dev'),

    PORT: z.coerce.number().positive().default(3000),
    HOST: z.string().default('localhost'),

    DB_URL: z.string().startsWith('postgresql://'),
    DB_POOL_MIN: z.coerce.number().min(0).default(2),
    DB_POOL_MAX: z.coerce.number().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));

    parsed.error.issues.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  ${path}: ${err.message}`);
    });

    process.exit(1);
}

export const env = parsed.data;
