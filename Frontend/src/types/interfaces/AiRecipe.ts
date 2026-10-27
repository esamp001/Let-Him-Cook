import type { AiIngredient } from './AiIngredient';
import type { Recipe } from './Recipe';

export interface AiRecipe {
  title: string;
  description: string;
  cookingTimeMinutes: number | null;
  difficulty: Recipe['difficulty'];
  ingredients: AiIngredient[];
  steps: string[];
  recommendationReason: string;
  alreadyHave: AiIngredient[];
  imageUrl?: string | null;
}
