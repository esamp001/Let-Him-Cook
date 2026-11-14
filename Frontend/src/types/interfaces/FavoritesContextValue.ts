import type { Recipe } from './Recipe';
import type { SavedRecipe } from './SavedRecipe';

export interface FavoritesContextValue {
  favorites: SavedRecipe[];
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipe: Recipe) => Promise<void>;
}
