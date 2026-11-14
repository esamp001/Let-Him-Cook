import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email', 320).notNullable().unique();
    table.string('name', 120).notNullable();
    // Empty for accounts that only sign in with a social provider.
    table.string('password_hash', 255).nullable();
    table.string('role', 16).notNullable().defaultTo('user');
    table.timestamps(true, true, true);
  });

  // The Knex schema builder has no CHECK constraint helper for a fixed value list.
  await knex.raw(`
    ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'admin'));
  `);

  await knex.schema.createTable('user_identities', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').index();
    table.string('provider', 32).notNullable();
    table.string('provider_user_id', 255).notNullable();
    table.string('email', 320).nullable();
    table.timestamps(true, true, true);

    table.unique(['provider', 'provider_user_id']);
  });

  await knex.schema.createTable('user_sessions', (table) => {
    // SHA-256 hash of the session token; the raw token only lives in the browser cookie.
    table.string('token_hash', 64).primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').index();
    table.timestamp('expires_at', { useTz: true }).notNullable().index();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('user_sessions');
  await knex.schema.dropTableIfExists('user_identities');
  await knex.schema.dropTableIfExists('users');
};
