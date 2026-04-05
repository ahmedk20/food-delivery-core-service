import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TABLE restaurants
        (
            id                BigSerial PRIMARY KEY,
            owner_id          BIGINT    NOT NULL,
            name              TEXT      NOT NULL unique ,
            logo_url          TEXT      NOT NULL,
            status            TEXT      NOT NULL CHECK (status IN ('active', 'inactive', 'pending', 'rejected', 'suspended')),
            primary_country   TEXT      NOT NULL,
            created_at        TIMESTAMP NOT NULL,
            updated_at        TIMESTAMP NOT NULL,
            deleted_at        TIMESTAMP,
            status_updated_at TIMESTAMP NOT NULL,
            constraint fk_restaurants_owner_id foreign key (owner_id) references users(id)
        );
        create index idx_restaurants_owner_id on restaurants(owner_id);
        create index idx_restaurants_status on restaurants(status);
        create index idx_restaurants_primary_country on restaurants(primary_country);
        create index idx_restaurants_status_updated_at on restaurants(status_updated_at);
        
    `)
}


export async function down(knex: Knex): Promise<void> {
}

