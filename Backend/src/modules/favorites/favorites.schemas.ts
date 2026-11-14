import { z } from 'zod';

// A copy of the recipe as the app shows it. Unknown fields such as per-chat "isOwned" flags are dropped.
export const savedRecipeSnapshotSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4_000).optional(),
  cuisine: z.string().max(80).optional(),
  imageUrl: z.string().max(2_048),
  cookingTimeMinutes: z.number().int().positive().nullable(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).nullable(),
  ingredients: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    quantity: z.string().max(120).optional(),
    isOptional: z.boolean().optional(),
  })).max(60),
  steps: z.array(z.string().max(4_000)).max(60),
  source: z.enum(['themealdb', 'community', 'ai-generated']).optional(),
  sourceUrl: z.string().max(2_048).nullable().optional(),
});

export const saveFavoriteRequestSchema = z.object({
  recipe: savedRecipeSnapshotSchema,
});

export const recipeKeyParamsSchema = z.object({
  recipeKey: z.string().trim().min(1).max(120),
});
