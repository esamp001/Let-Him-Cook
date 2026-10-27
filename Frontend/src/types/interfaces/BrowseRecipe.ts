export interface BrowseRecipe {
  id: string;
  title: string;
  description: string;
  cuisine: string | null;
  imageUrl: string | null;
  cookingTimeMinutes: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  ingredients: { name: string; quantity: string; isOptional: boolean }[];
  steps: string[];
  source: 'themealdb' | 'community';
  sourceUrl: string | null;
}
