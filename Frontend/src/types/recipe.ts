export interface RecipeIngredient {
  name: string;
  quantity?: string;
  isOwned?: boolean;
  isOptional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  cookingTimeMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isFavorite?: boolean;
  ingredients: RecipeIngredient[];
  steps: string[];
}
