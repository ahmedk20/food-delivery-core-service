import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';

// Called INSIDE a business transaction. The event row and the business change
// share one transaction, so they commit or roll back atomically — that is what
// removes the dual-write inconsistency between Postgres and RabbitMQ.
//
// `conn` is the active transaction (Knex.Transaction). `aggregateId` identifies
// the domain object the event is about (for tracing/debugging only).
export async function writeOutboxEvent(
    conn: Knex,
    eventType: string,
    aggregateId: string,
    payload: object,
): Promise<void> {
    await conn('events_outbox').insert({
        event_id:     randomUUID(),
        event_type:   eventType,
        aggregate_id: aggregateId,
        payload:      JSON.stringify(payload),
        created_at:   new Date(),
    });
}
