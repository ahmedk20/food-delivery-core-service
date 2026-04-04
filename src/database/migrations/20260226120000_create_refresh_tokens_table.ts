import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TABLE refresh_tokens (
            id          SERIAL PRIMARY KEY,
            user_id     BIGINT NOT NULL,
            token_hash  TEXT NOT NULL UNIQUE,
            expires_at  TIMESTAMP NOT NULL,
            created_at  TIMESTAMP NOT NULL,
            revoked_at  TIMESTAMP,
            CONSTRAINT fk_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
        CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
    `);
}


export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP TABLE refresh_tokens;`);
}
