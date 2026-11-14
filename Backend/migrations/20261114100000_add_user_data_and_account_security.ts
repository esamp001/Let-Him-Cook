import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('users', (table) => {
    table.timestamp('email_verified_at', { useTz: true }).nullable();
  });

  // Accounts that already sign in with Google have a verified email.
  await knex('users')
    .whereIn('id', knex('user_identities').select('user_id').where({ provider: 'google' }))
    .update({ email_verified_at: knex.fn.now() });

  await knex.schema.createTable('auth_tokens', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').index();
    table.string('purpose', 32).notNullable();
    // SHA-256 hash of the token; the raw token only appears in the emailed link.
    table.string('token_hash', 64).notNullable().unique();
    table.timestamp('expires_at', { useTz: true }).notNullable().index();
    table.timestamp('used_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // The Knex schema builder has no CHECK constraint helper for a fixed value list.
  await knex.raw(`
    ALTER TABLE auth_tokens
    ADD CONSTRAINT auth_tokens_purpose_check
    CHECK (purpose IN ('email_verification', 'password_reset'));
  `);

  // The community tables were created before users existed, so link them now.
  await knex.schema.alterTable('community_recipes', (table) => {
    table.foreign('author_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('reviewed_by_user_id').references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.alterTable('recipe_reactions', (table) => {
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });

  await knex.schema.alterTable('recipe_reports', (table) => {
    table.foreign('reporter_user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('reviewed_by_user_id').references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.alterTable('recipe_moderation_events', (table) => {
    table.foreign('moderator_user_id').references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.createTable('saved_recipes', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    // The recipe's own ID, such as `themealdb:52772` or `community:<uuid>`.
    table.string('recipe_key', 120).notNullable();
    // A copy of the recipe so saved recipes still show when the source is unavailable.
    table.jsonb('recipe').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'recipe_key']);
  });

  await knex.schema.createTable('shopping_list_items', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').index();
    table.string('name', 200).notNullable();
    table.string('quantity', 120).notNullable();
    table.boolean('checked').notNullable().defaultTo(false);
    table.timestamps(true, true, true);
  });

  await knex.schema.createTable('chat_conversations', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 60).notNullable();
    table.jsonb('messages').notNullable();
    table.jsonb('plan').notNullable();
    table.timestamps(true, true, true);

    // timestamps(true, true, true) creates camelCase createdAt and updatedAt columns.
    table.index(['user_id', 'updatedAt']);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('chat_conversations');
  await knex.schema.dropTableIfExists('shopping_list_items');
  await knex.schema.dropTableIfExists('saved_recipes');

  await knex.schema.alterTable('recipe_moderation_events', (table) => {
    table.dropForeign(['moderator_user_id']);
  });

  await knex.schema.alterTable('recipe_reports', (table) => {
    table.dropForeign(['reporter_user_id']);
    table.dropForeign(['reviewed_by_user_id']);
  });

  await knex.schema.alterTable('recipe_reactions', (table) => {
    table.dropForeign(['user_id']);
  });

  await knex.schema.alterTable('community_recipes', (table) => {
    table.dropForeign(['author_user_id']);
    table.dropForeign(['reviewed_by_user_id']);
  });

  await knex.schema.dropTableIfExists('auth_tokens');

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified_at');
  });
};
