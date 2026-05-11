import "reflect-metadata"
import * as http from "node:http";
import {createApp} from "./app.js";
import {env} from "./lib/config/env.js";
import {db} from "./lib/knex/knex.js";
import logger from "./lib/logger/logger.js";

const app = createApp();

const server = http.createServer(app);
server.listen(env.port, () => {
    console.log(`Server listening on ${env.port}`);
});

async function shutdown() {
    server.close(async () => {
        await db.destroy();
        process.exit(0);
    })
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason });
});

process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { err });
    process.exit(1);
});