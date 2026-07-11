import type { Knex } from 'knex';

export type OutboxRow = {
    id: number;
    event_id: string;
    event_type: string;
    aggregate_id: string;
    payload: unknown; // JSONB → driver returns a parsed object
    attempts: number;
};

// Claim the oldest unpublished rows that haven't exhausted their retries.
// FOR UPDATE SKIP LOCKED lets multiple dispatchers (if ever run) take disjoint
// batches instead of blocking on each other.
export async function claimPendingBatch(
    knex: Knex,
    maxAttempts: number,
    batchSize: number,
): Promise<OutboxRow[]> {
    const result = await knex.raw<{ rows: OutboxRow[] }>(`
        SELECT id, event_id, event_type, aggregate_id, payload, attempts
        FROM events_outbox
        WHERE dispatched_at IS NULL AND attempts < :maxAttempts
        ORDER BY created_at ASC
        LIMIT :batchSize
        FOR UPDATE SKIP LOCKED
    `, { maxAttempts, batchSize });
    return result.rows;
}

export async function markDispatched(knex: Knex, id: number): Promise<void> {
    await knex('events_outbox').where({ id }).update({ dispatched_at: new Date() });
}

export async function markFailed(knex: Knex, id: number, error: string): Promise<void> {
    await knex('events_outbox')
        .where({ id })
        .update({
            attempts:   knex.raw('attempts + 1'),
            last_error: error,
        });
}
