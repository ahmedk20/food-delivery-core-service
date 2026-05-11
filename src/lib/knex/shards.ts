import knex, { type Knex } from 'knex';
import { env } from '../config/env.js';

const hotShards     = new Map<string, Knex>();
const archiveShards = new Map<string, Knex>();

function buildConfig(region: string, cluster: 'hot' | 'archive'): Knex.Config {
    const prefix = cluster === 'hot' ? `DB_${region}` : `ARCHIVE_DB_${region}`;

    const host     = process.env[`${prefix}_HOST`];
    const port     = Number(process.env[`${prefix}_PORT`]     ?? 5432);
    const database = process.env[`${prefix}_NAME`];
    const user     = process.env[`${prefix}_USER`];
    const password = process.env[`${prefix}_PASSWORD`]        ?? '';

    if (!host || !database || !user) {
        throw new Error(`Missing DB config for ${prefix} — ensure all _HOST, _NAME, _USER vars are set`);
    }

    return {
        client: 'pg',
        connection: { host, port, database, user, password },
        pool: { min: env.db.poolMin, max: env.db.poolMax },
    };
}

export function getHotShard(region: string): Knex {
    if (!hotShards.has(region)) {
        hotShards.set(region, knex(buildConfig(region, 'hot')));
    }
    return hotShards.get(region)!;
}

export function getArchiveShard(region: string): Knex {
    if (!archiveShards.has(region)) {
        archiveShards.set(region, knex(buildConfig(region, 'archive')));
    }
    return archiveShards.get(region)!;
}

export async function destroyAllShards(): Promise<void> {
    const all = [...hotShards.values(), ...archiveShards.values()];
    await Promise.all(all.map(k => k.destroy()));
    hotShards.clear();
    archiveShards.clear();
}
