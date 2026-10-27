import type { Recipe } from './Recipe';

export interface PopularRecipesProps {
  onSelectRecipe?: (recipe: Recipe) => void;
  onViewAll?: () => void;
}
