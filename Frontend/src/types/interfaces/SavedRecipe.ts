import type { Recipe } from './Recipe';

export interface SavedRecipe {
  recipeKey: string;
  recipe: Recipe;
  savedAt: string;
}
