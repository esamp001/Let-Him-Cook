import { randomUUID } from 'node:crypto';
import { db } from '../../database/knex.js';
import type { SavedRecipeSnapshot } from './favorites.types.js';
import type { SavedRecipe } from './interfaces/SavedRecipe.js';
import type { SavedRecipeRow } from './interfaces/SavedRecipeRow.js';

export const listSavedRecipes = async (userId: string): Promise<SavedRecipe[]> => {
  const rows = await db('saved_recipes')
    .select<SavedRecipeRow[]>('recipe_key', 'recipe', 'created_at')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  return rows.map((row) => ({ recipeKey: row.recipe_key, recipe: row.recipe, savedAt: row.created_at.toISOString() }));
};

export const saveRecipe = async (userId: string, recipe: SavedRecipeSnapshot): Promise<void> => {
  await db('saved_recipes')
    // The pg driver sends JS arrays as Postgres arrays, so jsonb values are serialized explicitly.
    .insert({ id: randomUUID(), user_id: userId, recipe_key: recipe.id, recipe: JSON.stringify(recipe) })
    .onConflict(['user_id', 'recipe_key'])
    .merge({ recipe: JSON.stringify(recipe) });
};

export const deleteSavedRecipe = async (userId: string, recipeKey: string): Promise<number> => {
  return db('saved_recipes').where({ user_id: userId, recipe_key: recipeKey }).delete();
};
