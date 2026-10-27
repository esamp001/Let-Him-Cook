import { env } from '../../config/env.js';
import { getRecipeCacheKey, logOllamaTiming, trimExpiredCacheEntries } from '../../back-end-helpers/ollama-client.helpers.js';
import { createOllamaError, isOllamaError } from '../../back-end-helpers/ollama-error.helpers.js';
import { buildConversationDecisionPrompt, buildExternalRecipeSelectionPrompt, buildFinalRecipePrompt, buildInitialChatPrompt, buildPlanUpdatePrompt, buildRecipeDraftPrompt, buildRecipeSuggestionPrompt } from '../../back-end-helpers/ollama-prompt.helpers.js';
import { aiConversationDecisionSchema, aiConversationPlanUpdateSchema, aiExternalRecipeSelectionSchema, aiFinalChatRecipeSchema, aiInitialChatModelResponseSchema, aiRecipeResponseSchema, recipeDraftSchema, type AiConversationDecision, type AiConversationPlanUpdate, type AiExternalRecipeSelection, type AiFinalChatRecipe, type AiInitialChatModelResponse, type AiRecipeResponse, type CookingPlan, type CuisinePreference } from './ai.types.js';
import type { ExternalRecipe } from '../recipes/interfaces/ExternalRecipe.js';
import type { OllamaGenerateResponse } from './interfaces/OllamaGenerateResponse.js';
import type { StructuredGenerationResult } from './interfaces/StructuredGenerationResult.js';
import type { OllamaGenerationOptions } from './interfaces/OllamaGenerationOptions.js';
import type { RecipeDraftImportResult } from './interfaces/RecipeDraftImportResult.js';

const recipeResponseSchema = {
  type: 'object',
  properties: {
    availableIngredients: { type: 'array', items: { type: 'string' } },
    preferences: { type: 'array', items: { type: 'string' } },
    recipes: {
      type: 'array',
      minItems: 1,
      maxItems: 2,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          cookingTimeMinutes: { type: 'integer' },
          difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
          ingredients: {
            type: 'array',
            maxItems: 12,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'string' },
                optional: { type: 'boolean' },
              },
              required: ['name', 'quantity', 'optional'],
            },
          },
          steps: { type: 'array', maxItems: 6, items: { type: 'string' } },
          videoSearchQuery: { type: 'string' },
          recommendationReason: { type: 'string' },
        },
        required: ['title', 'description', 'cookingTimeMinutes', 'difficulty', 'ingredients', 'steps', 'videoSearchQuery', 'recommendationReason'],
      },
    },
  },
  required: ['availableIngredients', 'preferences', 'recipes'],
} as const;

const conversationPlanUpdateResponseSchema = {
  type: 'object',
  properties: {
    userIntent: { type: 'string', enum: ['question', 'preference_response'] },
    plan: {
      type: 'object',
      properties: {
        ingredients: { type: 'array', items: { type: 'string' }, maxItems: 20 },
        cuisine: { type: 'string', enum: ['any', 'filipino', 'asian', 'italian', 'western'] },
        preferences: { type: 'array', items: { type: 'string' }, maxItems: 8 },
      },
      required: ['ingredients', 'cuisine', 'preferences'],
    },
  },
  required: ['userIntent', 'plan'],
} as const;

const conversationDecisionResponseSchema = {
  type: 'object',
  properties: {
    suggestion: { type: 'string' },
    followUpQuestion: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    followUpOptions: { type: 'array', minItems: 0, maxItems: 6, items: { type: 'string' } },
    action: { type: 'string', enum: ['ask_follow_up', 'generate_recipe'] },
  },
  required: ['suggestion', 'followUpQuestion', 'followUpOptions', 'action'],
} as const;

const finalChatRecipeResponseSchema = {
  type: 'object',
  properties: {
    recipe: recipeResponseSchema.properties.recipes.items,
  },
  required: ['recipe'],
} as const;

const recipeDraftResponseSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    cuisine: { type: 'string', enum: ['any', 'filipino', 'asian', 'italian', 'western', 'other'] },
    cookingTimeMinutes: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    difficulty: { anyOf: [{ type: 'string', enum: ['Easy', 'Medium', 'Hard'] }, { type: 'null' }] },
    ingredients: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'string' },
          optional: { type: 'boolean' },
        },
        required: ['name', 'quantity', 'optional'],
      },
    },
    steps: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string' } },
  },
  required: ['title', 'description', 'cuisine', 'cookingTimeMinutes', 'difficulty', 'ingredients', 'steps'],
} as const;

const externalRecipeSelectionResponseSchema = {
  type: 'object',
  properties: {
    recipeId: { type: 'string' },
    reply: { type: 'string' },
  },
  required: ['recipeId', 'reply'],
} as const;

const initialChatResponseSchema = {
  type: 'object',
  properties: {
    userIntent: { type: 'string', enum: ['find_recipes_now', 'needs_clarification'] },
    suggestion: { type: 'string' },
    followUpQuestion: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    followUpOptions: { type: 'array', minItems: 0, maxItems: 6, items: { type: 'string' } },
    plan: {
      type: 'object',
      properties: {
        ingredients: { type: 'array', items: { type: 'string' }, maxItems: 20 },
        cuisine: { type: 'string', enum: ['any', 'filipino', 'asian', 'italian', 'western'] },
        preferences: { type: 'array', items: { type: 'string' }, maxItems: 8 },
      },
      required: ['ingredients', 'cuisine', 'preferences'],
    },
  },
  required: ['userIntent', 'suggestion', 'followUpQuestion', 'followUpOptions', 'plan'],
} as const;

const recipeCache = new Map<string, { expiresAt: number; result: AiRecipeResponse }>();
const cacheTtlMs = 5 * 60 * 1_000;
const ollamaRequestTimeoutMs = 90_000;
const ollamaKeepAlive = '30m';

const defaultGenerationOptions: OllamaGenerationOptions = {
  temperature: 0.2,
  num_ctx: 2048,
  num_predict: 512,
};
const recipeImportGenerationOptions: OllamaGenerationOptions = {
  temperature: 0,
  num_ctx: 2048,
  num_predict: 768,
};

export const generateRecipeSuggestions = async (message: string, cuisinePreference: CuisinePreference): Promise<AiRecipeResponse> => {
  const now = Date.now();
  const cacheKey = getRecipeCacheKey(message, cuisinePreference);
  trimExpiredCacheEntries(recipeCache, now);

  const cached = recipeCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }

  let apiResponse: Response;

  try {
    apiResponse = await fetch(new URL('/api/generate', env.ollamaBaseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ollamaRequestTimeoutMs),
      body: JSON.stringify({
        model: env.ollamaModel,
        prompt: buildRecipeSuggestionPrompt(message, cuisinePreference),
        format: recipeResponseSchema,
        stream: false,
        think: false,
        keep_alive: ollamaKeepAlive,
        options: defaultGenerationOptions,
      }),
    });
  } catch (error) {
    throw createOllamaError('OLLAMA_UNAVAILABLE', 'Unable to connect to Ollama.', error);
  }

  if (!apiResponse.ok) {
    throw createOllamaError('OLLAMA_UNAVAILABLE', `Ollama returned status ${apiResponse.status}.`);
  }

  const payload = await apiResponse.json() as OllamaGenerateResponse;
  logOllamaTiming('recipe suggestions', payload);

  if (!payload.response) {
    throw new Error('Ollama returned an empty response.');
  }

  const result = aiRecipeResponseSchema.parse(JSON.parse(payload.response));
  recipeCache.set(cacheKey, { expiresAt: now + cacheTtlMs, result });

  return result;
};

export const generateInitialChatTurn = async (message: string, plan: CookingPlan, isRetry = false): Promise<AiInitialChatModelResponse> => {
  let apiResponse: Response;

  try {
    apiResponse = await fetch(new URL('/api/generate', env.ollamaBaseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ollamaRequestTimeoutMs),
      body: JSON.stringify({
        model: env.ollamaModel,
        prompt: buildInitialChatPrompt(message, plan, isRetry),
        format: initialChatResponseSchema,
        stream: false,
        think: false,
        keep_alive: ollamaKeepAlive,
        options: defaultGenerationOptions,
      }),
    });
  } catch (error) {
    throw createOllamaError('OLLAMA_UNAVAILABLE', 'Unable to connect to Ollama.', error);
  }

  if (!apiResponse.ok) {
    throw createOllamaError('OLLAMA_UNAVAILABLE', `Ollama returned status ${apiResponse.status}.`);
  }

  const payload = await apiResponse.json() as OllamaGenerateResponse;
  logOllamaTiming('initial chat turn', payload);

  if (!payload.response) {
    throw new Error('Ollama returned an empty response.');
  }

  return aiInitialChatModelResponseSchema.parse(JSON.parse(payload.response));
};

const generateStructuredResponse = async (
  prompt: string,
  format: object,
  operation: string,
  model = env.ollamaModel,
  options = defaultGenerationOptions,
) => {
  let apiResponse: Response;

  try {
    apiResponse = await fetch(new URL('/api/generate', env.ollamaBaseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(ollamaRequestTimeoutMs),
      body: JSON.stringify({
        model,
        prompt,
        format,
        stream: false,
        think: false,
        keep_alive: ollamaKeepAlive,
        options,
      }),
    });
  } catch (error) {
    throw createOllamaError('OLLAMA_UNAVAILABLE', 'Unable to connect to Ollama.', error);
  }

  if (!apiResponse.ok) {
    throw createOllamaError('OLLAMA_UNAVAILABLE', `Ollama returned status ${apiResponse.status}.`);
  }

  const payload = await apiResponse.json() as OllamaGenerateResponse;
  logOllamaTiming(operation, payload);

  if (!payload.response) {
    throw new Error('Ollama returned an empty response.');
  }

  try {
    return {
      result: JSON.parse(payload.response) as unknown,
      outputLimitReached: payload.eval_count !== undefined && payload.eval_count >= options.num_predict,
    } satisfies StructuredGenerationResult;
  } catch (error) {
    throw createOllamaError('OLLAMA_INVALID_RESPONSE', `${operation} returned incomplete or invalid JSON.`, error);
  }
};

export const updateConversationPlan = async (message: string, plan: CookingPlan, isRetry = false): Promise<AiConversationPlanUpdate> => {
  const generated = await generateStructuredResponse(buildPlanUpdatePrompt(message, plan, isRetry), conversationPlanUpdateResponseSchema, 'conversation plan update');
  return aiConversationPlanUpdateSchema.parse(generated.result);
};

export const decideConversationTurn = async (plan: CookingPlan, userIntent: 'question' | 'preference_response', isRetry = false): Promise<AiConversationDecision> => {
  const generated = await generateStructuredResponse(buildConversationDecisionPrompt(plan, userIntent, isRetry), conversationDecisionResponseSchema, 'conversation decision');
  return aiConversationDecisionSchema.parse(generated.result);
};

export const generateFinalChatRecipe = async (plan: CookingPlan, isRetry = false): Promise<AiFinalChatRecipe> => {
  const generated = await generateStructuredResponse(buildFinalRecipePrompt(plan, isRetry), finalChatRecipeResponseSchema, 'final chat recipe');
  return aiFinalChatRecipeSchema.parse(generated.result);
};

export const extractRecipeDraft = async (rawText: string): Promise<RecipeDraftImportResult> => {
  const prompt = buildRecipeDraftPrompt(rawText);

  try {
    const generated = await generateStructuredResponse(
      prompt,
      recipeDraftResponseSchema,
      'recipe draft import',
      env.ollamaImportModel,
      recipeImportGenerationOptions,
    );
    return {
      draft: recipeDraftSchema.parse(generated.result),
      mayBeIncomplete: generated.outputLimitReached,
    };
  } catch (error) {
    if (isOllamaError(error, 'OLLAMA_UNAVAILABLE') || env.ollamaImportModel === env.ollamaModel) {
      throw error;
    }

    console.warn('Recipe import model returned an invalid draft. Retrying with the primary Ollama model.');

    try {
      const generated = await generateStructuredResponse(
        prompt,
        recipeDraftResponseSchema,
        'recipe draft import retry',
        env.ollamaModel,
        defaultGenerationOptions,
      );
      return {
        draft: recipeDraftSchema.parse(generated.result),
        mayBeIncomplete: true,
      };
    } catch (retryError) {
      if (isOllamaError(retryError, 'OLLAMA_UNAVAILABLE')) throw retryError;
      throw createOllamaError('OLLAMA_INVALID_RESPONSE', 'The recipe importer could not create a complete draft. Please paste the ingredients and steps as separate lists, then try again.', retryError);
    }
  }
};

export const selectExternalRecipe = async (plan: CookingPlan, recipes: ExternalRecipe[]): Promise<AiExternalRecipeSelection> => {
  const generated = await generateStructuredResponse(buildExternalRecipeSelectionPrompt(plan, recipes), externalRecipeSelectionResponseSchema, 'external recipe selection');
  return aiExternalRecipeSelectionSchema.parse(generated.result);
};
