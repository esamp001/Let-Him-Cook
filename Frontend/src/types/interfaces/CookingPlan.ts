import type { CuisinePreference } from '../ai';

export interface CookingPlan {
  ingredients: string[];
  cuisine: CuisinePreference;
  preferences: string[];
  questionCount: number;
}
