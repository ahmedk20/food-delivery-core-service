import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TABLE events_outbox (
            id            BIGSERIAL PRIMARY KEY,
            event_id      UUID NOT NULL UNIQUE,
            event_type    TEXT NOT NULL,
            aggregate_id  TEXT NOT NULL,
            payload       JSONB NOT NULL,
            attempts      INT NOT NULL DEFAULT 0,
            last_error    TEXT,
            dispatched_at TIMESTAMP,
            created_at    TIMESTAMP NOT NULL
        );

        -- The dispatcher only ever queries for unpublished rows, oldest first.
        -- A partial index keeps that scan tiny even as dispatched history grows.
        CREATE INDEX idx_events_outbox_unpublished
            ON events_outbox (created_at)
            WHERE dispatched_at IS NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP TABLE IF EXISTS events_outbox;
    `);
}
