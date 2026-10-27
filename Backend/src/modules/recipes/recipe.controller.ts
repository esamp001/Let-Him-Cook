import type { RequestHandler } from 'express';
import { filterBrowseRecipes, toMealDbBrowseRecipe } from '../../back-end-helpers/recipe-browse.helpers.js';
import { listPublishedCommunityRecipes } from './recipe.repository.js';
import { browseRecipeQuerySchema } from './recipe.schemas.js';
import { listTheMealDbRecipes } from './themealdb.client.js';
import type { BrowseRecipe } from './interfaces/BrowseRecipe.js';

export const browseRecipes: RequestHandler = async (request, response, next) => {
  const parsedRequest = browseRecipeQuerySchema.safeParse(request.query);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid recipe browse filters.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { page, pageSize, search, cuisine, ingredient, source } = parsedRequest.data;

  let finalRecipes: BrowseRecipe[] = [];
  let cuisines: string[] = [];
  let total = 0;

  try {
    // Fetch recipes from both TheMealDB and the community database
    const publishedRecipes = await listPublishedCommunityRecipes();
    const externalRecipes = await listTheMealDbRecipes();

    // Convert TheMealDB recipes to the BrowseRecipe format
    const mealDbRecipes = externalRecipes.map(toMealDbBrowseRecipe); 

    // Combine both sets of recipes
    const allRecipes = [...mealDbRecipes, ...publishedRecipes];

    // Prepare the list of unique cuisines for filtering
    cuisines = [...new Set(allRecipes.map((recipe) => recipe.cuisine?.toLowerCase()).filter((value): value is string => Boolean(value)))].sort();

    // Filter, sort, and paginate the combined recipes
    finalRecipes = filterBrowseRecipes(allRecipes, search, cuisine, ingredient, source)
      .sort((first, second) => first.title.localeCompare(second.title));

    // Calculate total before pagination
    total = finalRecipes.length;

    // Apply pagination
    const start = (page - 1) * pageSize;

    // Send the response with the filtered and paginated recipes
    response.status(200).json({
      data: {
        recipes: finalRecipes.slice(start, start + pageSize),
        cuisines,
        page,
        pageSize,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};
