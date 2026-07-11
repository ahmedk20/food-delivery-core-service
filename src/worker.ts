import "reflect-metadata";
import "./lib/di/container";
import { container } from "./lib/di/container";
import { env } from "./lib/config/env";
import { db, pingDB } from "./lib/knex/knex";
import logger from "./lib/logger/logger";
import { TOKENS } from "./lib/di/tokens";
import { startOutboxDispatcher } from "./lib/outbox/dispatcher";
import type { IMessageBroker } from "./pkg/messaging/message-broker.interface";

async function main() {
    logger.info("Core worker starting — pinging DB…");
    await pingDB();
    logger.info("DB reachable");

    const broker = container.resolve<IMessageBroker>(TOKENS.MessageBroker);
    await broker.connect();
    await broker.assertExchange(env.rabbitmq.coreEvents.exchange);
    logger.info("RabbitMQ broker connected", { exchange: env.rabbitmq.coreEvents.exchange });

    startOutboxDispatcher(broker);
    logger.info("Core worker running");

    async function shutdown() {
        logger.info("Core worker shutting down…");
        await broker.close();
        await db.destroy();
        process.exit(0);
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

main().catch(err => {
    logger.error("Worker fatal startup error", { err });
    process.exit(1);
});
