import type { z } from 'zod';
import type { communityRecipeStatusSchema, createCommunityRecipeSchema, recipeReactionSchema, reportReasonSchema } from './community.schemas.js';

export type CommunityRecipeStatus = z.infer<typeof communityRecipeStatusSchema>;
export type RecipeReaction = z.infer<typeof recipeReactionSchema>;
export type ReportReason = z.infer<typeof reportReasonSchema>;
export type NewCommunityRecipe = z.infer<typeof createCommunityRecipeSchema>;
