import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { toCommunityRecipe } from '../../back-end-helpers/community-recipe.helpers.js';
import { db } from '../../database/knex.js';
import type { PublishedIngredientRow } from '../recipes/interfaces/PublishedIngredientRow.js';
import type { PublishedStepRow } from '../recipes/interfaces/PublishedStepRow.js';
import type { NewCommunityRecipe, RecipeReaction, ReportReason } from './community.types.js';
import type { CommunityRecipe } from './interfaces/CommunityRecipe.js';
import type { CommunityRecipeRow } from './interfaces/CommunityRecipeRow.js';
import type { RecipeFeedback } from './interfaces/RecipeFeedback.js';

export const communityRecipeColumns = [
  'community_recipes.id',
  'community_recipes.author_user_id',
  'community_recipes.title',
  'community_recipes.description',
  'community_recipes.cuisine',
  'community_recipes.image_url',
  'community_recipes.source_url',
  'community_recipes.cooking_time_minutes',
  'community_recipes.difficulty',
  'community_recipes.status',
  'community_recipes.helpful_count',
  'community_recipes.not_helpful_count',
  'community_recipes.submitted_at',
  'community_recipes.published_at',
] as const;

export const listRecipeIngredientsAndSteps = async (recipeIds: string[]): Promise<{ ingredientRows: PublishedIngredientRow[]; stepRows: PublishedStepRow[] }> => {
  if (recipeIds.length === 0) return { ingredientRows: [], stepRows: [] };

  const ingredientRows = await db<PublishedIngredientRow>('community_recipe_ingredients')
    .select('recipe_id', 'name', 'quantity', 'is_optional', 'position')
    .whereIn('recipe_id', recipeIds);

  const stepRows = await db<PublishedStepRow>('community_recipe_steps')
    .select('recipe_id', 'instruction', 'position')
    .whereIn('recipe_id', recipeIds);

  return { ingredientRows, stepRows };
};

export const listOwnedRecipes = async (userId: string): Promise<CommunityRecipe[]> => {
  const recipeRows = await db('community_recipes')
    .select<CommunityRecipeRow[]>(...communityRecipeColumns)
    .where({ author_user_id: userId })
    .orderBy('community_recipes.createdAt', 'desc');

  const { ingredientRows, stepRows } = await listRecipeIngredientsAndSteps(recipeRows.map((recipe) => recipe.id));

  return recipeRows.map((recipe) => toCommunityRecipe(recipe, ingredientRows, stepRows));
};

export const createOwnedRecipe = async (userId: string, recipe: NewCommunityRecipe): Promise<CommunityRecipe> => {
  return db.transaction(async (transaction) => {
    const [recipeRow] = await transaction('community_recipes')
      .insert({
        id: randomUUID(),
        author_user_id: userId,
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        cooking_time_minutes: recipe.cookingTimeMinutes,
        difficulty: recipe.difficulty,
        source: 'community',
        status: 'private',
      })
      .returning<CommunityRecipeRow[]>([...communityRecipeColumns]);

    const ingredientRows = await transaction('community_recipe_ingredients')
      .insert(recipe.ingredients.map((ingredient, position) => ({
        id: randomUUID(),
        recipe_id: recipeRow.id,
        name: ingredient.name,
        quantity: ingredient.quantity || 'Not specified',
        is_optional: ingredient.isOptional,
        position,
      })))
      .returning<PublishedIngredientRow[]>(['recipe_id', 'name', 'quantity', 'is_optional', 'position']);

    const stepRows = await transaction('community_recipe_steps')
      .insert(recipe.steps.map((instruction, position) => ({ id: randomUUID(), recipe_id: recipeRow.id, instruction, position })))
      .returning<PublishedStepRow[]>(['recipe_id', 'instruction', 'position']);

    return toCommunityRecipe(recipeRow, ingredientRows, stepRows);
  });
};

export const findRecipeRow = async (recipeId: string): Promise<CommunityRecipeRow | undefined> => {
  return db('community_recipes')
    .select<CommunityRecipeRow>(...communityRecipeColumns)
    .where('community_recipes.id', recipeId)
    .first();
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  await db('community_recipes').where({ id: recipeId }).delete();
};

export const submitRecipeForReview = async (recipeId: string): Promise<void> => {
  await db.transaction(async (transaction) => {
    await transaction('community_recipes')
      .where({ id: recipeId })
      .update({ status: 'pending_review', submitted_at: transaction.fn.now(), updatedAt: transaction.fn.now() });

    await transaction('recipe_moderation_events').insert({ id: randomUUID(), recipe_id: recipeId, moderator_user_id: null, action: 'submitted', note: 'Submitted by the author.' });
  });
};

export const getRecipeFeedback = async (recipe: CommunityRecipeRow, userId: string | undefined): Promise<RecipeFeedback> => {
  const myReaction = userId
    ? await db('recipe_reactions').select<{ reaction: RecipeReaction }>('reaction').where({ recipe_id: recipe.id, user_id: userId }).first()
    : undefined;

  const openReport = userId
    ? await db('recipe_reports').select('id').where({ recipe_id: recipe.id, reporter_user_id: userId, status: 'open' }).first()
    : undefined;

  return {
    helpfulCount: recipe.helpful_count,
    notHelpfulCount: recipe.not_helpful_count,
    myReaction: myReaction?.reaction ?? null,
    hasOpenReport: Boolean(openReport),
    isOwner: userId !== undefined && recipe.author_user_id === userId,
  };
};

// Recounts reactions from recipe_reactions so the stored counts can never drift.
const refreshReactionCounts = async (transaction: Knex.Transaction, recipeId: string): Promise<{ helpfulCount: number; notHelpfulCount: number }> => {
  const counts = await transaction('recipe_reactions')
    .select('reaction')
    .count<{ reaction: RecipeReaction; count: string }[]>({ count: '*' })
    .where({ recipe_id: recipeId })
    .groupBy('reaction');

  const helpfulCount = Number(counts.find((row) => row.reaction === 'helpful')?.count ?? 0);
  const notHelpfulCount = Number(counts.find((row) => row.reaction === 'not_helpful')?.count ?? 0);

  await transaction('community_recipes')
    .where({ id: recipeId })
    .update({ helpful_count: helpfulCount, not_helpful_count: notHelpfulCount });

  return { helpfulCount, notHelpfulCount };
};

export const saveReaction = async (recipeId: string, userId: string, reaction: RecipeReaction | null): Promise<{ helpfulCount: number; notHelpfulCount: number }> => {
  return db.transaction(async (transaction) => {
    if (reaction) {
      // One reaction per user per recipe; reacting again changes it.
      await transaction('recipe_reactions')
        .insert({ id: randomUUID(), recipe_id: recipeId, user_id: userId, reaction })
        .onConflict(['recipe_id', 'user_id'])
        .merge({ reaction, updatedAt: transaction.fn.now() });
    } else {
      await transaction('recipe_reactions').where({ recipe_id: recipeId, user_id: userId }).delete();
    }

    return refreshReactionCounts(transaction, recipeId);
  });
};

export const createReport = async (recipeId: string, userId: string, reason: ReportReason, details: string | undefined): Promise<void> => {
  await db('recipe_reports').insert({ id: randomUUID(), recipe_id: recipeId, reporter_user_id: userId, reason, details: details ?? null });
};

export const countOpenReports = async (recipeId: string): Promise<number> => {
  const [{ count }] = await db('recipe_reports')
    .where({ recipe_id: recipeId, status: 'open' })
    .countDistinct<{ count: string }[]>({ count: 'reporter_user_id' });

  return Number(count);
};

export const flagRecipeForReview = async (recipeId: string, note: string): Promise<boolean> => {
  return db.transaction(async (transaction) => {
    // Only a published recipe can be flagged; the recipe is hidden for review, never deleted.
    const updatedCount = await transaction('community_recipes')
      .where({ id: recipeId, status: 'published' })
      .update({ status: 'needs_review', updatedAt: transaction.fn.now() });

    if (updatedCount === 0) return false;

    await transaction('recipe_moderation_events').insert({ id: randomUUID(), recipe_id: recipeId, moderator_user_id: null, action: 'flagged_for_review', note });

    return true;
  });
};
