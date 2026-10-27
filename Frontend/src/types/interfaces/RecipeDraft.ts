import type { RecipeCuisine } from '../recipe';
import type { DraftIngredient } from './DraftIngredient';
import type { Recipe } from './Recipe';

export interface RecipeDraft {
  title: string;
  description: string;
  cuisine: RecipeCuisine;
  cookingTimeMinutes: number | null;
  difficulty: Recipe['difficulty'];
  ingredients: DraftIngredient[];
  steps: string[];
}
