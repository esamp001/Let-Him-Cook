import { db } from '../../database/knex.js';
import type { BrowseRecipe } from './interfaces/BrowseRecipe.js';
import type { PublishedRecipeRow } from './interfaces/PublishedRecipeRow.js';
import type { PublishedIngredientRow } from './interfaces/PublishedIngredientRow.js';
import type { PublishedStepRow } from './interfaces/PublishedStepRow.js';

export const listPublishedCommunityRecipes = async (): Promise<BrowseRecipe[]> => {
  const recipeRows = await db<PublishedRecipeRow>('community_recipes')
    .select('id', 'title', 'description', 'cuisine', 'image_url', 'source_url', 'cooking_time_minutes', 'difficulty')
    .where('status', 'published')
    .andWhere('source', 'community');

  if (recipeRows.length === 0) return [];

  const recipeIds = recipeRows.map((recipe) => recipe.id);

  const ingredientRows = await db<PublishedIngredientRow>('community_recipe_ingredients')
    .select('recipe_id', 'name', 'quantity', 'is_optional', 'position')
    .whereIn('recipe_id', recipeIds)
    .orderBy('position');
    
  const stepRows = await db<PublishedStepRow>('community_recipe_steps')
    .select('recipe_id', 'instruction', 'position')
    .whereIn('recipe_id', recipeIds)
    .orderBy('position');

  return recipeRows.map((recipe) => ({
    id: `community:${recipe.id}`,
    title: recipe.title.trim(),
    description: recipe.description ?? '',
    cuisine: recipe.cuisine,
    imageUrl: recipe.image_url,
    cookingTimeMinutes: recipe.cooking_time_minutes,
    difficulty: recipe.difficulty,
    ingredients: ingredientRows
      .filter((ingredient) => ingredient.recipe_id === recipe.id && ingredient.name.trim().length > 0)
      .map((ingredient) => ({ name: ingredient.name.trim(), quantity: ingredient.quantity.trim() || 'Not specified', isOptional: ingredient.is_optional })),
    steps: stepRows.filter((step) => step.recipe_id === recipe.id && step.instruction.trim().length > 0).map((step) => step.instruction.trim()),
    source: 'community' as const,
    sourceUrl: recipe.source_url,
  })).filter((recipe) => recipe.title.trim().length > 0 && recipe.ingredients.length > 0 && recipe.steps.length > 0);
};
