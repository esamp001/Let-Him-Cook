import type { RequestHandler } from 'express';
import { canSubmitForReview, shouldFlagForReview } from '../../back-end-helpers/community-moderation.helpers.js';
import { countOpenReports, createOwnedRecipe, createReport, deleteRecipe, findRecipeRow, flagRecipeForReview, getRecipeFeedback, listOwnedRecipes, saveReaction, submitRecipeForReview } from './community.repository.js';
import { createCommunityRecipeSchema, recipeIdParamsSchema, recipeReactionRequestSchema, recipeReportRequestSchema } from './community.schemas.js';
import type { CommunityRecipe } from './interfaces/CommunityRecipe.js';
import type { RecipeFeedback } from './interfaces/RecipeFeedback.js';

const recipeNotFoundError = {
  error: {
    code: 'RECIPE_NOT_FOUND',
    message: 'This recipe was not found.',
  },
} as const;

const invalidRecipeIdError = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'The recipe ID is not valid.',
  },
} as const;

const ownRecipeFeedbackError = {
  error: {
    code: 'OWN_RECIPE',
    message: 'You cannot rate or report your own recipe.',
  },
} as const;

export const listMyRecipes: RequestHandler = async (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('listMyRecipes must run after requireAuth.');
  }

  let recipes: CommunityRecipe[] = [];

  try {
    recipes = await listOwnedRecipes(authUser.id);

    response.status(200).json({ data: { recipes } });
  } catch (error) {
    next(error);
  }
};

export const createMyRecipe: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('createMyRecipe must run after requireAuth.');
  }

  const parsedRequest = createCommunityRecipeSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Add a title, at least one ingredient, and one cooking step.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const newRecipe = parsedRequest.data;

  let recipe: CommunityRecipe;

  try {
    recipe = await createOwnedRecipe(authUser.id, newRecipe);

    response.status(201).json({ data: { recipe } });
  } catch (error) {
    next(error);
  }
};

export const deleteMyRecipe: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('deleteMyRecipe must run after requireAuth.');
  }

  const parsedParams = recipeIdParamsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    response.status(400).json(invalidRecipeIdError);
    return;
  }

  const { recipeId } = parsedParams.data;

  try {
    const recipe = await findRecipeRow(recipeId);

    // Another user's recipe answers 404, so recipe IDs cannot be probed.
    if (!recipe || recipe.author_user_id !== authUser.id) {
      response.status(404).json(recipeNotFoundError);
      return;
    }

    await deleteRecipe(recipeId);

    response.status(200).json({ data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};

export const submitMyRecipe: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('submitMyRecipe must run after requireAuth.');
  }

  const parsedParams = recipeIdParamsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    response.status(400).json(invalidRecipeIdError);
    return;
  }

  const { recipeId } = parsedParams.data;

  try {
    const recipe = await findRecipeRow(recipeId);

    if (!recipe || recipe.author_user_id !== authUser.id) {
      response.status(404).json(recipeNotFoundError);
      return;
    }

    if (!canSubmitForReview(recipe.status)) {
      response.status(409).json({
        error: {
          code: 'INVALID_RECIPE_STATUS',
          message: 'This recipe is already published or waiting for review.',
        },
      });
      return;
    }

    await submitRecipeForReview(recipeId);

    response.status(200).json({ data: { status: 'pending_review' } });
  } catch (error) {
    next(error);
  }
};

export const getFeedback: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;
  const parsedParams = recipeIdParamsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    response.status(400).json(invalidRecipeIdError);
    return;
  }

  const { recipeId } = parsedParams.data;

  let feedback: RecipeFeedback;

  try {
    const recipe = await findRecipeRow(recipeId);
    const canView = recipe && (recipe.status === 'published' || recipe.author_user_id === authUser?.id || authUser?.role === 'admin');

    if (!recipe || !canView) {
      response.status(404).json(recipeNotFoundError);
      return;
    }

    feedback = await getRecipeFeedback(recipe, authUser?.id);

    response.status(200).json({ data: { feedback } });
  } catch (error) {
    next(error);
  }
};

export const setReaction: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('setReaction must run after requireAuth.');
  }

  const parsedParams = recipeIdParamsSchema.safeParse(request.params);
  const parsedRequest = recipeReactionRequestSchema.safeParse(request.body);

  if (!parsedParams.success || !parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Choose helpful or not helpful.',
      },
    });
    return;
  }

  const { recipeId } = parsedParams.data;
  const { reaction } = parsedRequest.data;

  let flagged = false;

  try {
    const recipe = await findRecipeRow(recipeId);

    if (!recipe || recipe.status !== 'published') {
      response.status(404).json(recipeNotFoundError);
      return;
    }

    if (recipe.author_user_id === authUser.id) {
      response.status(403).json(ownRecipeFeedbackError);
      return;
    }

    const { helpfulCount, notHelpfulCount } = await saveReaction(recipeId, authUser.id, reaction);

    if (shouldFlagForReview(await countOpenReports(recipeId), helpfulCount, notHelpfulCount)) {
      flagged = await flagRecipeForReview(recipeId, 'Automatically flagged because most reactions were "not helpful".');
    }

    response.status(200).json({ data: { helpfulCount, notHelpfulCount, myReaction: reaction, flagged } });
  } catch (error) {
    next(error);
  }
};

export const removeReaction: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('removeReaction must run after requireAuth.');
  }

  const parsedParams = recipeIdParamsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    response.status(400).json(invalidRecipeIdError);
    return;
  }

  const { recipeId } = parsedParams.data;

  try {
    const recipe = await findRecipeRow(recipeId);

    if (!recipe || recipe.status !== 'published') {
      response.status(404).json(recipeNotFoundError);
      return;
    }

    const { helpfulCount, notHelpfulCount } = await saveReaction(recipeId, authUser.id, null);

    response.status(200).json({ data: { helpfulCount, notHelpfulCount, myReaction: null } });
  } catch (error) {
    next(error);
  }
};

export const reportRecipe: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('reportRecipe must run after requireAuth.');
  }

  const parsedParams = recipeIdParamsSchema.safeParse(request.params);
  const parsedRequest = recipeReportRequestSchema.safeParse(request.body);

  if (!parsedParams.success || !parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Choose a reason for the report.',
      },
    });
    return;
  }

  const { recipeId } = parsedParams.data;
  const { reason, details } = parsedRequest.data;

  let flagged = false;

  try {
    const recipe = await findRecipeRow(recipeId);

    if (!recipe || recipe.status !== 'published') {
      response.status(404).json(recipeNotFoundError);
      return;
    }

    if (recipe.author_user_id === authUser.id) {
      response.status(403).json(ownRecipeFeedbackError);
      return;
    }

    const { hasOpenReport } = await getRecipeFeedback(recipe, authUser.id);

    if (hasOpenReport) {
      response.status(409).json({
        error: {
          code: 'ALREADY_REPORTED',
          message: 'You already reported this recipe. A moderator will review it.',
        },
      });
      return;
    }

    await createReport(recipeId, authUser.id, reason, details);

    if (shouldFlagForReview(await countOpenReports(recipeId), recipe.helpful_count, recipe.not_helpful_count)) {
      flagged = await flagRecipeForReview(recipeId, 'Automatically flagged after several reports.');
    }

    response.status(201).json({ data: { reported: true, flagged } });
  } catch (error) {
    next(error);
  }
};
