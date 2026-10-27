import type { Recipe } from './Recipe';
import type { ShoppingItem } from './ShoppingItem';

export interface RecipeDetailPageProps {
  recipe: Recipe;
  onBack: () => void;
  onAddToShoppingList: (items: ShoppingItem[]) => void;
}
