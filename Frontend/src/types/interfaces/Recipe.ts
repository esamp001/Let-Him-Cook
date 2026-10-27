import type { RecipeCuisine } from '../recipe';
import type { RecipeIngredient } from './RecipeIngredient';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  cuisine?: RecipeCuisine;
  imageUrl: string;
  cookingTimeMinutes: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  isFavorite?: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
}
