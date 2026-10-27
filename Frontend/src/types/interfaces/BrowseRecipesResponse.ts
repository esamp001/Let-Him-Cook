import type { BrowseRecipe } from './BrowseRecipe';

export interface BrowseRecipesResponse {
  data?: {
    recipes: BrowseRecipe[];
    cuisines: string[];
    page: number;
    pageSize: number;
    total: number;
  };
  error?: { message?: string };
}
