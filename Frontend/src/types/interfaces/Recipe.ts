import type { RecipeIngredient } from './RecipeIngredient';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  cuisine?: string;
  imageUrl: string;
  cookingTimeMinutes: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  isFavorite?: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
  source?: 'themealdb' | 'community' | 'ai-generated';
  sourceUrl?: string | null;
}
