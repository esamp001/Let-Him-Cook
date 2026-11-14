import { randomUUID } from 'node:crypto';
import { moderationEventActions } from '../../back-end-helpers/community-moderation.helpers.js';
import { toCommunityRecipe } from '../../back-end-helpers/community-recipe.helpers.js';
import { db } from '../../database/knex.js';
import { communityRecipeColumns, listRecipeIngredientsAndSteps } from '../community/community.repository.js';
import type { CommunityRecipeStatus } from '../community/community.types.js';
import type { ModerationAction, ReportStatus } from './moderation.types.js';
import type { ModerationRecipe } from './interfaces/ModerationRecipe.js';
import type { ModerationRecipeRow } from './interfaces/ModerationRecipeRow.js';
import type { RecipeReportItem } from './interfaces/RecipeReportItem.js';
import type { RecipeReportRow } from './interfaces/RecipeReportRow.js';

export const listRecipesForModeration = async (statuses: readonly CommunityRecipeStatus[]): Promise<ModerationRecipe[]> => {
  const openReportCount = db('recipe_reports')
    .count('*')
    .where('recipe_reports.recipe_id', db.ref('community_recipes.id'))
    .andWhere('recipe_reports.status', 'open')
    .as('open_report_count');

  const recipeRows = await db('community_recipes')
    .leftJoin('users', 'users.id', 'community_recipes.author_user_id')
    .select<ModerationRecipeRow[]>(...communityRecipeColumns, 'users.name as author_name', openReportCount)
    .whereIn('community_recipes.status', statuses)
    .orderBy('community_recipes.updatedAt', 'desc');

  const { ingredientRows, stepRows } = await listRecipeIngredientsAndSteps(recipeRows.map((recipe) => recipe.id));

  return recipeRows.map((recipe) => ({
    ...toCommunityRecipe(recipe, ingredientRows, stepRows),
    authorName: recipe.author_name,
    openReportCount: Number(recipe.open_report_count),
  }));
};

export const applyModerationAction = async (
  recipeId: string,
  moderatorId: string,
  action: ModerationAction,
  currentStatus: CommunityRecipeStatus,
  nextStatus: CommunityRecipeStatus,
  publishedAt: Date | null,
  note: string | undefined,
): Promise<void> => {
  await db.transaction(async (transaction) => {
    await transaction('community_recipes')
      .where({ id: recipeId })
      .update({
        status: nextStatus,
        reviewed_by_user_id: moderatorId,
        reviewed_at: transaction.fn.now(),
        published_at: publishedAt,
        updatedAt: transaction.fn.now(),
      });

    await transaction('recipe_moderation_events').insert({ id: randomUUID(), recipe_id: recipeId, moderator_user_id: moderatorId, action: moderationEventActions[action], note: note ?? null });

    // Deciding on a flagged recipe settles the reports that flagged it.
    if (currentStatus === 'needs_review') {
      await transaction('recipe_reports')
        .where({ recipe_id: recipeId, status: 'open' })
        .update({ status: 'resolved', reviewed_by_user_id: moderatorId, reviewed_at: transaction.fn.now(), updatedAt: transaction.fn.now() });
    }
  });
};

export const listReports = async (status: ReportStatus): Promise<RecipeReportItem[]> => {
  const reportRows = await db('recipe_reports')
    .join('community_recipes', 'community_recipes.id', 'recipe_reports.recipe_id')
    .leftJoin('users', 'users.id', 'recipe_reports.reporter_user_id')
    .select<RecipeReportRow[]>(
      'recipe_reports.id',
      'recipe_reports.recipe_id',
      'community_recipes.title as recipe_title',
      'community_recipes.status as recipe_status',
      'recipe_reports.reason',
      'recipe_reports.details',
      'recipe_reports.status',
      'users.name as reporter_name',
      'recipe_reports.createdAt',
    )
    .where('recipe_reports.status', status)
    .orderBy('recipe_reports.createdAt', 'desc');

  return reportRows.map((report) => ({
    id: report.id,
    recipeId: report.recipe_id,
    recipeTitle: report.recipe_title,
    recipeStatus: report.recipe_status,
    reason: report.reason,
    details: report.details,
    status: report.status,
    reporterName: report.reporter_name,
    createdAt: report.createdAt.toISOString(),
  }));
};

export const resolveReport = async (reportId: string, moderatorId: string, status: Exclude<ReportStatus, 'open'>): Promise<boolean> => {
  const updatedCount = await db('recipe_reports')
    .where({ id: reportId, status: 'open' })
    .update({ status, reviewed_by_user_id: moderatorId, reviewed_at: db.fn.now(), updatedAt: db.fn.now() });

  return updatedCount > 0;
};
