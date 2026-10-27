import type { Recipe } from './Recipe';

export interface MyRecipesPageProps {
  recipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}
