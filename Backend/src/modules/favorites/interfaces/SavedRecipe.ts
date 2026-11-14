import type { SavedRecipeSnapshot } from '../favorites.types.js';

export interface SavedRecipe {
  recipeKey: string;
  recipe: SavedRecipeSnapshot;
  savedAt: string;
}
