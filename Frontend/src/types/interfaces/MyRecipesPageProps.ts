import type { Recipe } from './Recipe';

export interface MyRecipesPageProps {
  onSelectRecipe: (recipe: Recipe, recipes: Recipe[]) => void;
}
