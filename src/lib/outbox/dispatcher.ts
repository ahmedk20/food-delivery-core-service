import { db } from '../knex/knex';
import logger from '../logger/logger';
import { env } from '../config/env';
import { claimPendingBatch, markDispatched, markFailed } from './outbox.repo';
import type { IMessageBroker } from '../../pkg/messaging/message-broker.interface';

// After this many failed publish attempts a row is left alone (and visible via
// last_error) so a poison message can't loop forever.
const MAX_ATTEMPTS = 5;

// Single-DB dispatcher (core is not sharded, so no per-region loop). Runs in the
// worker process and polls the outbox on a fixed tick.
export function startOutboxDispatcher(broker: IMessageBroker): void {
    const batchSize      = env.rabbitmq.outbox.batchSize;
    const pollIntervalMs = env.rabbitmq.outbox.drainTickSec * 1_000;
    const exchange       = env.rabbitmq.coreEvents.exchange;

    async function tick(): Promise<void> {
        const rows = await claimPendingBatch(db, MAX_ATTEMPTS, batchSize);

        for (const row of rows) {
            try {
                const body = Buffer.from(
                    typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload),
                );
                // routing key = event_type, e.g. "product.price_changed"
                await broker.publish(exchange, row.event_type, body);
                await markDispatched(db, row.id);
            } catch (err) {
                await markFailed(db, row.id, String(err));
                logger.warn('Outbox dispatch failed', { id: row.id, attempts: row.attempts + 1 });
            }
        }
    }

    setInterval(() => {
        tick().catch(err => logger.error('Outbox tick error', { err }));
    }, pollIntervalMs);

    logger.info('Outbox dispatcher started', { exchange, batchSize, pollIntervalMs });
}
