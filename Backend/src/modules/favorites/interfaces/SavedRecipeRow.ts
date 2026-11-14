import type { SavedRecipeSnapshot } from '../favorites.types.js';

export interface SavedRecipeRow {
  recipe_key: string;
  recipe: SavedRecipeSnapshot;
  created_at: Date;
}
