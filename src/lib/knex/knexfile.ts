import { config } from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';

// knexfile is used only by the Knex CLI (npm run migrate).
// Load .env manually because the CLI does not go through server.ts.
const stage = process.env.APP_STAGE || 'dev';
const rootPath = path.resolve(__dirname, '../../../');

if (stage === 'dev') {
    config({ path: path.join(rootPath, '.env.dev') });
} else if (stage === 'test') {
    config({ path: path.join(rootPath, '.env.test') });
} else {
    config({ path: path.join(rootPath, '.env') });
}

const region  = process.env.REGION;
const cluster = process.env.CLUSTER ?? 'hot';

if (!region) {
    throw new Error(
        'REGION env var is required. Usage: REGION=eg CLUSTER=hot npx knex migrate:latest'
    );
}

const prefix   = cluster === 'hot' ? `DB_${region}` : `ARCHIVE_DB_${region}`;
const host     = process.env[`${prefix}_HOST`];
const port     = Number(process.env[`${prefix}_PORT`]     ?? 5432);
const database = process.env[`${prefix}_NAME`];
const user     = process.env[`${prefix}_USER`];
const password = process.env[`${prefix}_PASSWORD`]        ?? '';

if (!host || !database || !user) {
    throw new Error(`Missing DB config for ${prefix} — check your .env file`);
}

const knexConfig: Knex.Config = {
    client: 'pg',
    connection: { host, port, database, user, password },
    pool: {
        min: Number(process.env.DB_POOL_MIN ?? 2),
        max: Number(process.env.DB_POOL_MAX ?? 10),
    },
    migrations: {
        directory: path.resolve(rootPath, 'src/database/migrations'),
        extension: 'ts',
    },
};

export default knexConfig;
