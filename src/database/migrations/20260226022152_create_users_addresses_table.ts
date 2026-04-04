import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
       CREATE TABLE "users_addresses" (
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,        
            label TEXT NOT NULL,
            country TEXT NOT NULL,
            city TEXT NOT NULL,
            street TEXT NOT NULL,
            building TEXT NOT NULL,
            apartmentNumber TEXT NOT NULL,
            type TEXT check (type IN ('home','office')) NOT NULL,
            latitude DECIMAL NOT NULL,
            longitude DECIMAL NOT NULL,
            is_defult BOOLEAN  NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            deleted_at TIMESTAMP,
            CONSTRAINT fk_password_resets_user_id FOREIGN KEY (user_id) REFERENCES users(id)

       );
       CREATE INDEX idx_users_addresses_user_id ON users_addresses(user_id);
           `);

}


export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP TABLE "users_addresses"`)
}

