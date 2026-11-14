import type { RequestHandler } from 'express';
import { deleteSavedRecipe, listSavedRecipes, saveRecipe } from './favorites.repository.js';
import { recipeKeyParamsSchema, saveFavoriteRequestSchema } from './favorites.schemas.js';
import type { SavedRecipe } from './interfaces/SavedRecipe.js';

export const listFavorites: RequestHandler = async (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('listFavorites must run after requireAuth.');
  }

  let favorites: SavedRecipe[] = [];

  try {
    favorites = await listSavedRecipes(authUser.id);

    response.status(200).json({ data: { favorites } });
  } catch (error) {
    next(error);
  }
};

export const addFavorite: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('addFavorite must run after requireAuth.');
  }

  const parsedRequest = saveFavoriteRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'This recipe could not be saved.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { recipe } = parsedRequest.data;

  try {
    await saveRecipe(authUser.id, recipe);

    response.status(200).json({ data: { recipeKey: recipe.id, saved: true } });
  } catch (error) {
    next(error);
  }
};

export const removeFavorite: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('removeFavorite must run after requireAuth.');
  }

  const parsedParams = recipeKeyParamsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The recipe key is not valid.',
      },
    });
    return;
  }

  const { recipeKey } = parsedParams.data;

  try {
    await deleteSavedRecipe(authUser.id, recipeKey);

    response.status(200).json({ data: { recipeKey, saved: false } });
  } catch (error) {
    next(error);
  }
};
