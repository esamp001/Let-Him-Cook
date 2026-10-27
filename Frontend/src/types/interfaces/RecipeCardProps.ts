import type { Recipe } from './Recipe';

export interface RecipeCardProps {
  recipe: Recipe;
  onSelect?: (recipe: Recipe) => void;
}
