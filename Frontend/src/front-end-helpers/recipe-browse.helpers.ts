import type { BrowseRecipe } from '../types/interfaces/BrowseRecipe';
import type { Recipe } from '../types/interfaces/Recipe';

/**
 * Name: toBrowseUiRecipe.
 * Returns: A recipe ready for recipe cards and the detail page.
 * Parameters: A recipe returned by the shared browse endpoint.
 * Description: Adapts the API's source-aware recipe to the existing UI shape.
 */
export const toBrowseUiRecipe = (recipe: BrowseRecipe): Recipe => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description,
  cuisine: recipe.cuisine ?? undefined,
  imageUrl: recipe.imageUrl ?? '',
  cookingTimeMinutes: recipe.cookingTimeMinutes,
  difficulty: recipe.difficulty,
  ingredients: recipe.ingredients,
  steps: recipe.steps,
  source: recipe.source,
  sourceUrl: recipe.sourceUrl,
});
