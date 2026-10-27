import { z } from 'zod';

export const cuisinePreferenceSchema = z.enum(['any', 'filipino', 'asian', 'italian', 'western']);
export const fallbackChoiceSchema = z.enum(['relax_ingredients', 'relax_cuisine', 'ai_recipe']);

export const aiRecipeRequestSchema = z.object({
  message: z.string().trim().min(1).max(1_000),
  cuisinePreference: cuisinePreferenceSchema.optional().default('any'),
});

export const recipeDraftRequestSchema = z.object({
  rawText: z.string().trim().min(20).max(4_000),
});

export const cookingPlanSchema = z.object({
  ingredients: z.array(z.string().trim().min(1)).max(20),
  cuisine: cuisinePreferenceSchema,
  preferences: z.array(z.string().trim().min(1)).max(8),
  questionCount: z.number().int().min(0).max(5),
});

export const aiChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1_000),
  plan: cookingPlanSchema.optional().default({
    ingredients: [],
    cuisine: 'any',
    preferences: [],
    questionCount: 0,
  }),
  fallbackChoice: fallbackChoiceSchema.optional(),
});

export const generatedIngredientSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  optional: z.boolean(),
});

export const recipeDraftSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  cuisine: z.enum(['any', 'filipino', 'asian', 'italian', 'western', 'other']),
  cookingTimeMinutes: z.number().int().positive().nullable(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).nullable(),
  ingredients: z.array(generatedIngredientSchema).min(1).max(30),
  steps: z.array(z.string().trim().min(1)).min(1).max(20),
});

export const generatedRecipeSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  cookingTimeMinutes: z.number().int().positive(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  ingredients: z.array(generatedIngredientSchema).min(1).max(12),
  steps: z.array(z.string().trim().min(1)).min(1).max(6),
  videoSearchQuery: z.string().trim().min(1),
  recommendationReason: z.string().trim().min(1),
});

export const aiRecipeResponseSchema = z.object({
  availableIngredients: z.array(z.string().trim().min(1)),
  preferences: z.array(z.string().trim().min(1)),
  recipes: z.array(generatedRecipeSchema).min(1).max(2),
});

export const aiConversationPlanUpdateSchema = z.object({
  userIntent: z.enum(['question', 'preference_response']),
  plan: z.object({
    ingredients: z.array(z.string().trim().min(1)).max(20),
    cuisine: cuisinePreferenceSchema,
    preferences: z.array(z.string().trim().min(1)).max(8),
  }),
});

export const aiConversationDecisionSchema = z.object({
  suggestion: z.string().trim().min(1),
  followUpQuestion: z.string().trim().min(1).nullable(),
  followUpOptions: z.array(z.string().trim().min(1)).max(6),
  action: z.enum(['ask_follow_up', 'generate_recipe']),
});

export const aiFinalChatRecipeSchema = z.object({
  recipe: generatedRecipeSchema,
});

export const aiExternalRecipeSelectionSchema = z.object({
  recipeId: z.string().trim().min(1),
  reply: z.string().trim().min(1),
});

export const aiInitialChatModelResponseSchema = z.object({
  userIntent: z.enum(['find_recipes_now', 'needs_clarification']),
  suggestion: z.string().trim().min(1),
  followUpQuestion: z.string().trim().min(1).nullable(),
  followUpOptions: z.array(z.string().trim().min(1)).max(6),
  plan: z.object({
    ingredients: z.array(z.string().trim().min(1)).max(20),
    cuisine: cuisinePreferenceSchema,
    preferences: z.array(z.string().trim().min(1)).max(8),
  }),
});

export type AiRecipeRequest = z.infer<typeof aiRecipeRequestSchema>;
export type RecipeDraftRequest = z.infer<typeof recipeDraftRequestSchema>;
export type RecipeDraft = z.infer<typeof recipeDraftSchema>;
export type AiRecipeResponse = z.infer<typeof aiRecipeResponseSchema>;
export type CuisinePreference = z.infer<typeof cuisinePreferenceSchema>;
export type FallbackChoice = z.infer<typeof fallbackChoiceSchema>;
export type CookingPlan = z.infer<typeof cookingPlanSchema>;
export type AiConversationPlanUpdate = z.infer<typeof aiConversationPlanUpdateSchema>;
export type AiConversationDecision = z.infer<typeof aiConversationDecisionSchema>;
export type AiFinalChatRecipe = z.infer<typeof aiFinalChatRecipeSchema>;
export type AiExternalRecipeSelection = z.infer<typeof aiExternalRecipeSelectionSchema>;
export type AiInitialChatModelResponse = z.infer<typeof aiInitialChatModelResponseSchema>;
