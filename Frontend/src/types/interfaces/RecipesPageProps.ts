import type { Recipe } from './Recipe';
import type { ShoppingItem } from './ShoppingItem';

export interface RecipesPageProps {
  searchQuery: string;
  recipes: Recipe[] | null;
  preferences: string[];
  isLoading: boolean;
  error: string | null;
  selectedRecipe: Recipe | null;
  onSelectRecipe: (recipe: Recipe | null) => void;
  onAddToShoppingList: (items: ShoppingItem[]) => void;
  onContributeRecipe: () => void;
}
