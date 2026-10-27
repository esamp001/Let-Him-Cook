import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('community_recipes', (table) => {
    table.uuid('id').primary();
    table.uuid('author_user_id').nullable().index();
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.string('cuisine', 80).nullable().index();
    table.string('image_url', 2_048).nullable();
    table.string('source_url', 2_048).nullable();
    table.string('attribution', 500).nullable();
    table.string('source', 32).notNullable().defaultTo('community');
    table.string('status', 32).notNullable().defaultTo('private').index();
    table.integer('cooking_time_minutes').nullable();
    table.string('difficulty', 16).nullable();
    table.integer('helpful_count').notNullable().defaultTo(0);
    table.integer('not_helpful_count').notNullable().defaultTo(0);
    table.integer('save_count').notNullable().defaultTo(0);
    table.timestamp('submitted_at', { useTz: true }).nullable();
    table.timestamp('published_at', { useTz: true }).nullable();
    table.timestamp('reviewed_at', { useTz: true }).nullable();
    table.uuid('reviewed_by_user_id').nullable().index();
    table.timestamps(true, true, true);

    table.index(['status', 'cuisine', 'published_at']);
  });

  await knex.raw(`
    ALTER TABLE community_recipes
    ADD CONSTRAINT community_recipes_source_check
    CHECK (source IN ('community', 'themealdb', 'ai-generated')),
    ADD CONSTRAINT community_recipes_status_check
    CHECK (status IN ('private', 'pending_review', 'published', 'needs_review', 'unpublished', 'rejected')),
    ADD CONSTRAINT community_recipes_difficulty_check
    CHECK (difficulty IS NULL OR difficulty IN ('Easy', 'Medium', 'Hard')),
    ADD CONSTRAINT community_recipes_cooking_time_check
    CHECK (cooking_time_minutes IS NULL OR cooking_time_minutes > 0),
    ADD CONSTRAINT community_recipes_counts_check
    CHECK (helpful_count >= 0 AND not_helpful_count >= 0 AND save_count >= 0);
  `);

  await knex.schema.createTable('community_recipe_ingredients', (table) => {
    table.uuid('id').primary();
    table.uuid('recipe_id').notNullable().references('id').inTable('community_recipes').onDelete('CASCADE');
    table.string('name', 200).notNullable();
    table.string('quantity', 120).notNullable().defaultTo('Not specified');
    table.boolean('is_optional').notNullable().defaultTo(false);
    table.integer('position').notNullable();
    table.timestamps(true, true, true);

    table.unique(['recipe_id', 'position']);
  });

  await knex.schema.createTable('community_recipe_steps', (table) => {
    table.uuid('id').primary();
    table.uuid('recipe_id').notNullable().references('id').inTable('community_recipes').onDelete('CASCADE');
    table.text('instruction').notNullable();
    table.integer('position').notNullable();
    table.timestamps(true, true, true);

    table.unique(['recipe_id', 'position']);
  });

  await knex.schema.createTable('recipe_reactions', (table) => {
    table.uuid('id').primary();
    table.uuid('recipe_id').notNullable().references('id').inTable('community_recipes').onDelete('CASCADE');
    table.uuid('user_id').notNullable().index();
    table.string('reaction', 32).notNullable();
    table.timestamps(true, true, true);

    table.unique(['recipe_id', 'user_id']);
    table.index(['recipe_id', 'reaction']);
  });

  await knex.raw(`
    ALTER TABLE recipe_reactions
    ADD CONSTRAINT recipe_reactions_reaction_check
    CHECK (reaction IN ('helpful', 'not_helpful'));
  `);

  await knex.schema.createTable('recipe_reports', (table) => {
    table.uuid('id').primary();
    table.uuid('recipe_id').notNullable().references('id').inTable('community_recipes').onDelete('CASCADE');
    table.uuid('reporter_user_id').notNullable().index();
    table.string('reason', 64).notNullable();
    table.text('details').nullable();
    table.string('status', 32).notNullable().defaultTo('open').index();
    table.uuid('reviewed_by_user_id').nullable().index();
    table.timestamp('reviewed_at', { useTz: true }).nullable();
    table.timestamps(true, true, true);

    table.index(['recipe_id', 'status']);
  });

  await knex.raw(`
    ALTER TABLE recipe_reports
    ADD CONSTRAINT recipe_reports_reason_check
    CHECK (reason IN ('incorrect_recipe', 'not_filipino', 'unsafe', 'spam', 'copyright', 'other')),
    ADD CONSTRAINT recipe_reports_status_check
    CHECK (status IN ('open', 'resolved', 'dismissed'));
  `);

  await knex.schema.createTable('recipe_moderation_events', (table) => {
    table.uuid('id').primary();
    table.uuid('recipe_id').notNullable().references('id').inTable('community_recipes').onDelete('CASCADE');
    table.uuid('moderator_user_id').nullable().index();
    table.string('action', 32).notNullable();
    table.text('note').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['recipe_id', 'created_at']);
  });

  await knex.raw(`
    ALTER TABLE recipe_moderation_events
    ADD CONSTRAINT recipe_moderation_events_action_check
    CHECK (action IN ('submitted', 'approved', 'unpublished', 'rejected', 'restored', 'flagged_for_review'));
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('recipe_moderation_events');
  await knex.schema.dropTableIfExists('recipe_reports');
  await knex.schema.dropTableIfExists('recipe_reactions');
  await knex.schema.dropTableIfExists('community_recipe_steps');
  await knex.schema.dropTableIfExists('community_recipe_ingredients');
  await knex.schema.dropTableIfExists('community_recipes');
};
