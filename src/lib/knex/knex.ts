import { type Knex } from 'knex';
import { env } from '../config/env.js';
import { getHotShard, getArchiveShard } from './shards.js';

export function db(region: string): Knex {
    return getHotShard(region);
}

export function dbArchive(region: string): Knex {
    return getArchiveShard(region);
}

export async function pingAll(): Promise<void> {
    await Promise.all(
        env.regions.map(region => getHotShard(region).raw('SELECT 1'))
    );
}
