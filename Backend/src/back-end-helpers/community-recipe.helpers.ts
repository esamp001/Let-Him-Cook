import type { CommunityRecipe } from '../modules/community/interfaces/CommunityRecipe.js';
import type { CommunityRecipeRow } from '../modules/community/interfaces/CommunityRecipeRow.js';
import type { PublishedIngredientRow } from '../modules/recipes/interfaces/PublishedIngredientRow.js';
import type { PublishedStepRow } from '../modules/recipes/interfaces/PublishedStepRow.js';

/**
 * Name: toCommunityRecipe.
 * Returns: A CommunityRecipe with its ingredients and steps in order.
 * Parameters: recipe, the community_recipes row; ingredientRows and stepRows, rows that may belong to several recipes.
 * Description: Converts database rows into the recipe shape used by My Recipes and the moderation queue.
 */
export const toCommunityRecipe = (recipe: CommunityRecipeRow, ingredientRows: PublishedIngredientRow[], stepRows: PublishedStepRow[]): CommunityRecipe => ({
  id: `community:${recipe.id}`,
  recipeId: recipe.id,
  title: recipe.title.trim(),
  description: recipe.description ?? '',
  cuisine: recipe.cuisine,
  imageUrl: recipe.image_url,
  cookingTimeMinutes: recipe.cooking_time_minutes,
  difficulty: recipe.difficulty,
  ingredients: ingredientRows
    .filter((ingredient) => ingredient.recipe_id === recipe.id)
    .sort((first, second) => first.position - second.position)
    .map((ingredient) => ({ name: ingredient.name, quantity: ingredient.quantity, isOptional: ingredient.is_optional })),
  steps: stepRows
    .filter((step) => step.recipe_id === recipe.id)
    .sort((first, second) => first.position - second.position)
    .map((step) => step.instruction),
  source: 'community',
  sourceUrl: recipe.source_url,
  status: recipe.status,
  helpfulCount: recipe.helpful_count,
  notHelpfulCount: recipe.not_helpful_count,
  submittedAt: recipe.submitted_at?.toISOString() ?? null,
  publishedAt: recipe.published_at?.toISOString() ?? null,
});
