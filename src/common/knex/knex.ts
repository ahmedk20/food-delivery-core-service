import knex from 'knex';
import {env} from "../config/env.js";
import type { Knex } from "knex";

const config: Knex.Config = {
    client:"pg",
    connection: {
        host: env.DB_URL,
    },
    pool:{
        max: env.DB_POOL_MAX,
        min: env.DB_POOL_MIN,
    },
    migrations: {
        directory:"./src/database/migrations",
        extension:"ts",
    }
}
export const db =  knex(config);
export async function pingDB(){
    await db.raw("SELECT 1");
}