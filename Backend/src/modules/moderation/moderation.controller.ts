import type { RequestHandler } from 'express';
import { defaultModerationQueueStatuses, getNextModerationStatus } from '../../back-end-helpers/community-moderation.helpers.js';
import { findRecipeRow } from '../community/community.repository.js';
import { recipeIdParamsSchema } from '../community/community.schemas.js';
import { applyModerationAction, listRecipesForModeration, listReports, resolveReport } from './moderation.repository.js';
import { moderationActionRequestSchema, moderationQueueQuerySchema, reportIdParamsSchema, reportListQuerySchema, resolveReportRequestSchema } from './moderation.schemas.js';
import type { ModerationRecipe } from './interfaces/ModerationRecipe.js';
import type { RecipeReportItem } from './interfaces/RecipeReportItem.js';

export const listModerationRecipes: RequestHandler = async (request, response, next) => {
  const parsedQuery = moderationQueueQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Choose a valid recipe status.',
        details: parsedQuery.error.flatten(),
      },
    });
    return;
  }

  const { status } = parsedQuery.data;

  let recipes: ModerationRecipe[] = [];

  try {
    recipes = await listRecipesForModeration(status ? [status] : defaultModerationQueueStatuses);

    response.status(200).json({ data: { recipes } });
  } catch (error) {
    next(error);
  }
};

export const moderateRecipe: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('moderateRecipe must run after requireAuth.');
  }

  const parsedParams = recipeIdParamsSchema.safeParse(request.params);
  const parsedRequest = moderationActionRequestSchema.safeParse(request.body);

  if (!parsedParams.success || !parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Choose approve, reject, unpublish, or restore.',
      },
    });
    return;
  }

  const { recipeId } = parsedParams.data;
  const { action, note } = parsedRequest.data;

  try {
    const recipe = await findRecipeRow(recipeId);

    if (!recipe) {
      response.status(404).json({
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: 'This recipe was not found.',
        },
      });
      return;
    }

    const nextStatus = getNextModerationStatus(action, recipe.status);

    if (!nextStatus) {
      response.status(409).json({
        error: {
          code: 'INVALID_RECIPE_STATUS',
          message: `A recipe that is ${recipe.status.replace('_', ' ')} cannot be moved with "${action}".`,
        },
      });
      return;
    }

    // Keep the first publication date when a recipe is restored.
    const publishedAt = nextStatus === 'published' ? recipe.published_at ?? new Date() : recipe.published_at;

    await applyModerationAction(recipeId, authUser.id, action, recipe.status, nextStatus, publishedAt, note);

    response.status(200).json({ data: { status: nextStatus } });
  } catch (error) {
    next(error);
  }
};

export const listRecipeReports: RequestHandler = async (request, response, next) => {
  const parsedQuery = reportListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Choose a valid report status.',
        details: parsedQuery.error.flatten(),
      },
    });
    return;
  }

  const { status } = parsedQuery.data;

  let reports: RecipeReportItem[] = [];

  try {
    reports = await listReports(status);

    response.status(200).json({ data: { reports } });
  } catch (error) {
    next(error);
  }
};

export const updateRecipeReport: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('updateRecipeReport must run after requireAuth.');
  }

  const parsedParams = reportIdParamsSchema.safeParse(request.params);
  const parsedRequest = resolveReportRequestSchema.safeParse(request.body);

  if (!parsedParams.success || !parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Mark the report as resolved or dismissed.',
      },
    });
    return;
  }

  const { reportId } = parsedParams.data;
  const { status } = parsedRequest.data;

  try {
    const wasUpdated = await resolveReport(reportId, authUser.id, status);

    if (!wasUpdated) {
      response.status(404).json({
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'This open report was not found.',
        },
      });
      return;
    }

    response.status(200).json({ data: { status } });
  } catch (error) {
    next(error);
  }
};
