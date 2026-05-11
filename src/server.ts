import 'reflect-metadata';
import * as http from 'node:http';
import { createApp } from './app.js';
import { env } from './lib/config/env.js';
import { destroyAllShards } from './lib/knex/shards.js';
import logger from './lib/logger/logger.js';

const app = createApp();
const server = http.createServer(app);

server.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port}`);
});

async function shutdown() {
    server.close(async () => {
        await destroyAllShards();
        process.exit(0);
    });
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    process.exit(1);
});
