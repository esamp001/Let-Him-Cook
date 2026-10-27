import type { ExternalRecipeIngredient } from './ExternalRecipeIngredient.js';

export interface ExternalRecipe {
  id: string;
  title: string;
  area: string | null;
  category: string | null;
  imageUrl: string | null;
  ingredients: ExternalRecipeIngredient[];
  steps: string[];
}
