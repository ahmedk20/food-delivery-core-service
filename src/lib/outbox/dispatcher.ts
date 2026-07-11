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
        // Claim → publish → mark all run inside ONE transaction so the
        // FOR UPDATE SKIP LOCKED locks are held for the whole batch. On the
        // pool (autocommit) the locks release the instant the claim SELECT
        // returns, and two workers could grab the same rows and double-publish.
        const trx = await db.transaction();
        try {
            const rows = await claimPendingBatch(trx, MAX_ATTEMPTS, batchSize);
            if (rows.length === 0) {
                await trx.commit();
                return;
            }

            for (const row of rows) {
                try {
                    // Include the unique event_id in the body so every event has a
                    // distinct byte payload. The consumer dedups on a hash of the
                    // body; without a unique id, two genuinely different events with
                    // the same fields (e.g. a second price change on the same
                    // product+branch) would collide and the later one would be
                    // dropped as a "duplicate". Business fields stay top-level so
                    // the consumer's payload.productId / payload.branchId reads work.
                    const payload = (typeof row.payload === 'string'
                        ? JSON.parse(row.payload)
                        : row.payload) as Record<string, unknown>;
                    const body = Buffer.from(JSON.stringify({ eventId: row.event_id, ...payload }));
                    // routing key = event_type, e.g. "product.price_changed"
                    await broker.publish(exchange, row.event_type, body);
                    await markDispatched(trx, row.id);
                } catch (err) {
                    // Publish failed — the broker is probably down, so the rest of
                    // the batch would fail too. Stop here instead of burning the
                    // whole batch's retry budget (attempts) on a single outage.
                    await markFailed(trx, row.id, String(err));
                    logger.warn('Outbox dispatch failed', { id: row.id, attempts: row.attempts + 1 });
                    break;
                }
            }

            await trx.commit();
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    }

    setInterval(() => {
        tick().catch(err => logger.error('Outbox tick error', { err }));
    }, pollIntervalMs);

    logger.info('Outbox dispatcher started', { exchange, batchSize, pollIntervalMs });
}
