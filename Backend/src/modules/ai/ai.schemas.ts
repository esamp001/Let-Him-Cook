import { z } from 'zod';

export const aiExternalRecipeHighlightsSchema = z.object({
  recipeIds: z.array(z.string().trim().min(1)).min(1).max(2),
});

export const aiIngredientResolutionSchema = z.object({
  ingredients: z.array(z.string().trim().min(1)).min(1).max(20),
});

export const ingredientResolutionResponseFormat = {
  type: 'object',
  properties: {
    ingredients: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
  },
  required: ['ingredients'],
} as const;
