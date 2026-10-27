import type { CuisinePreference } from '../ai';
import type { Recipe } from './Recipe';

export interface DashboardPageProps {
  onSearch: (ingredients: string, cuisinePreference: CuisinePreference) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onViewAllRecipes: () => void;
}
