import { z } from 'zod';

export const communityRecipeStatusSchema = z.enum(['private', 'pending_review', 'published', 'needs_review', 'unpublished', 'rejected']);
export const recipeReactionSchema = z.enum(['helpful', 'not_helpful']);
export const reportReasonSchema = z.enum(['incorrect_recipe', 'not_filipino', 'unsafe', 'spam', 'copyright', 'other']);

export const recipeIdParamsSchema = z.object({
  recipeId: z.string().uuid(),
});

export const createCommunityRecipeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2_000).default(''),
  cuisine: z.string().trim().min(1).max(80).nullable().default(null),
  cookingTimeMinutes: z.number().int().positive().max(1_440).nullable().default(null),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).nullable().default(null),
  ingredients: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    quantity: z.string().trim().max(120).default(''),
    isOptional: z.boolean().default(false),
  })).min(1).max(40),
  steps: z.array(z.string().trim().min(1).max(2_000)).min(1).max(30),
});

export const recipeReactionRequestSchema = z.object({
  reaction: recipeReactionSchema,
});

export const recipeReportRequestSchema = z.object({
  reason: reportReasonSchema,
  details: z.string().trim().max(1_000).optional(),
});
