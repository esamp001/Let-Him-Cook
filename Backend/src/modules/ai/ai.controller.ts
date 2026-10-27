import type { RequestHandler } from 'express';
import { aiChatRequestSchema, aiRecipeRequestSchema, recipeDraftRequestSchema, type AiConversationDecision, type AiInitialChatModelResponse, type CookingPlan, type FallbackChoice } from './ai.types.js';
import { decideConversationTurn, extractRecipeDraft, generateFinalChatRecipe, generateInitialChatTurn, generateRecipeSuggestions, updateConversationPlan } from './ollama.client.js';
import { searchTheMealDbRecipes, searchTheMealDbRecipesByCuisine } from '../recipes/themealdb.client.js';
import { formatConversationReply, formatCuisineDescription, formatCuisineName, getFallbackOptions, isValidConversationDecision, isValidInitialChatTurn, normalizeIngredient, parseStructuredRecipeDraft, toExternalChatRecipe, toGeneratedChatRecipe } from '../../back-end-helpers/ai-recipe.helpers.js';
import { isOllamaError } from '../../back-end-helpers/ollama-error.helpers.js';

export const generateRecipes: RequestHandler = async (request, response, next) => {
  const parsedRequest = aiRecipeRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A non-empty message is required.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { message, cuisinePreference } = parsedRequest.data;

  try {
    const generated = await generateRecipeSuggestions(message, cuisinePreference);
    const availableIngredients = new Set(generated.availableIngredients.map(normalizeIngredient));

    const recipes = generated.recipes.map((recipe) => ({
      ...recipe,
      source: 'ai-generated' as const,
      alreadyHave: recipe.ingredients.filter((ingredient) => availableIngredients.has(normalizeIngredient(ingredient.name))),
      missingIngredients: recipe.ingredients.filter((ingredient) => !ingredient.optional && !availableIngredients.has(normalizeIngredient(ingredient.name))),
    }));

    response.status(200).json({
      data: {
        availableIngredients: generated.availableIngredients,
        preferences: generated.preferences,
        recipes,
      },
    });
  } catch (error) {
    if (isOllamaError(error, 'OLLAMA_UNAVAILABLE')) {
      response.status(503).json({
        error: {
          code: 'AI_PROVIDER_UNAVAILABLE',
          message: 'The recipe provider is temporarily unavailable. Please try again shortly.',
        },
      });
      return;
    }

    next(error);
  }
};

export const createRecipeDraft: RequestHandler = async (request, response, next) => {
  const parsedRequest = recipeDraftRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Recipe text must be between 20 and 4,000 characters.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { rawText } = parsedRequest.data;

  try {
    const locallyParsedDraft = parseStructuredRecipeDraft(rawText);
    const importedDraft = locallyParsedDraft ? null : await extractRecipeDraft(rawText);
    const draft = locallyParsedDraft ?? importedDraft!.draft;

    response.status(200).json({
      data: {
        draft,
        importWarning: importedDraft?.mayBeIncomplete
          ? 'Some details may be missing because the recipe importer reached its response limit. Review the ingredients and steps before saving.'
          : undefined,
      },
    });
  } catch (error) {
    if (isOllamaError(error, 'OLLAMA_UNAVAILABLE')) {
      response.status(503).json({
        error: {
          code: 'AI_PROVIDER_UNAVAILABLE',
          message: 'The recipe importer is temporarily unavailable. Please try again shortly.',
        },
      });
      return;
    }

    if (isOllamaError(error, 'OLLAMA_INVALID_RESPONSE')) {
      response.status(422).json({
        error: {
          code: 'AI_PROVIDER_INVALID_RESPONSE',
          message: 'The recipe importer could not turn that text into a complete draft. Please paste the ingredients and steps as separate lists, then try again.',
        },
      });
      return;
    }

    next(error);
  }
};

const getRecipesForPlan = async (plan: CookingPlan) => {
  const externalRecipes = await searchTheMealDbRecipes(plan.ingredients, plan.cuisine);
  const availableIngredients = new Set(plan.ingredients.map(normalizeIngredient));

  if (externalRecipes.length > 0) {
    return { recipes: externalRecipes.map((recipe) => toExternalChatRecipe(recipe, availableIngredients)), fallbackOptions: [] };
  }

  if (plan.cuisine !== 'any') {
    return { recipes: [], fallbackOptions: getFallbackOptions(plan.cuisine) };
  }

  const generatedRecipe = await generateFinalChatRecipe(plan);

  return { recipes: [toGeneratedChatRecipe(generatedRecipe.recipe, availableIngredients)], fallbackOptions: [] };
};

const getFallbackRecipes = async (plan: CookingPlan, choice: FallbackChoice) => {
  const availableIngredients = new Set(plan.ingredients.map(normalizeIngredient));

  if (choice === 'relax_ingredients') {
    const recipes = await searchTheMealDbRecipesByCuisine(plan.cuisine);
    return {
      reply: recipes.length > 0
        ? `Here are ${formatCuisineName(plan.cuisine)} recipes. I highlighted ingredients you may need.`
        : `I still couldn't find ${formatCuisineName(plan.cuisine)} recipes from our recipe source.`,
      recipes: recipes.map((recipe) => toExternalChatRecipe(recipe, availableIngredients)),
    };
  }

  if (choice === 'relax_cuisine') {
    const recipes = await searchTheMealDbRecipes(plan.ingredients, 'any');
    return {
      reply: recipes.length > 0
        ? 'Here are recipes that match your ingredients from any cuisine.'
        : 'I could not find source recipes for those ingredients.',
      recipes: recipes.map((recipe) => toExternalChatRecipe(recipe, availableIngredients)),
    };
  }

  const generatedRecipe = await generateFinalChatRecipe(plan);
  return {
    reply: `Here is an AI-generated ${formatCuisineDescription(plan.cuisine)} suggestion.`,
    recipes: [toGeneratedChatRecipe(generatedRecipe.recipe, availableIngredients)],
  };
};

export const continueCookingConversation: RequestHandler = async (request, response, next) => {
  const parsedRequest = aiChatRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A non-empty chat message is required.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { message, plan, fallbackChoice } = parsedRequest.data;

  try {
    if (fallbackChoice) {
      const fallbackResult = await getFallbackRecipes(plan, fallbackChoice);
      response.status(200).json({
        data: {
          reply: fallbackResult.reply,
          action: 'generate_recipe',
          plan,
          followUpOptions: [],
          fallbackOptions: [],
          recipes: fallbackResult.recipes,
        },
      });
      return;
    }

    if (plan.questionCount === 0) {
      let initialTurn: AiInitialChatModelResponse | null = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const candidate = await generateInitialChatTurn(message, plan, attempt === 1);
        console.log(candidate, 'OLLAMA INITIAL CHAT TURN CANDIDATE');

        if (isValidInitialChatTurn(candidate, message)) {
          initialTurn = candidate;
          console.log(initialTurn, 'VALID INITIAL CHAT TURN FROM OLLAMA');
          break;
        }
      }

      if (!initialTurn) {
        response.status(502).json({
          error: {
            code: 'AI_PROVIDER_INVALID_RESPONSE',
            message: 'The recipe provider could not produce a valid response. Please try again.',
          },
        });
        return;
      }

      const initialPlan = { ...initialTurn.plan, questionCount: 0 };

      if (initialTurn.userIntent === 'find_recipes_now') {
        const recipeResult = await getRecipesForPlan(initialPlan);
        const hasFallbackOptions = recipeResult.fallbackOptions.length > 0;

        response.status(200).json({
          data: {
            reply: hasFallbackOptions ? `I couldn't find ${formatCuisineName(initialPlan.cuisine)} recipes that match your current ingredients. What would you like to do?` : initialTurn.suggestion,
            action: hasFallbackOptions ? 'choose_fallback' : 'generate_recipe',
            plan: initialPlan,
            followUpOptions: [],
            fallbackOptions: recipeResult.fallbackOptions,
            recipes: recipeResult.recipes,
          },
        });
        return;
      }

      response.status(200).json({
        data: {
          reply: formatConversationReply(initialTurn.suggestion, initialTurn.followUpQuestion),
          action: 'ask_follow_up',
          plan: { ...initialTurn.plan, questionCount: 1 },
          followUpOptions: initialTurn.followUpOptions,
          fallbackOptions: [],
          recipes: [],
        },
      });
      return;
    }

    const planUpdate = await updateConversationPlan(message, plan);
    const updatedPlan = { ...planUpdate.plan, questionCount: plan.questionCount };
    console.log(planUpdate, 'OLLAMA CONVERSATION PLAN UPDATE');

    let decision: AiConversationDecision | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const candidate = await decideConversationTurn(updatedPlan, planUpdate.userIntent, attempt === 1);
      console.log(candidate, 'OLLAMA CONVERSATION DECISION CANDIDATE');

      if (isValidConversationDecision(candidate, updatedPlan)) {
        decision = candidate;
        console.log(decision, 'VALID OLLAMA CONVERSATION DECISION');
        break;
      }
    }

    if (!decision) {
      response.status(502).json({
        error: {
          code: 'AI_PROVIDER_INVALID_RESPONSE',
          message: 'The recipe provider could not produce a valid response. Please try again.',
        },
      });
      return;
    }

    if (decision.action === 'ask_follow_up') {
      response.status(200).json({
        data: {
          reply: formatConversationReply(decision.suggestion, decision.followUpQuestion),
          action: 'ask_follow_up',
          plan: { ...updatedPlan, questionCount: plan.questionCount + 1 },
          followUpOptions: decision.followUpOptions,
          fallbackOptions: [],
          recipes: [],
        },
      });
      return;
    }

    const recipeResult = await getRecipesForPlan(updatedPlan);
    const hasFallbackOptions = recipeResult.fallbackOptions.length > 0;

    response.status(200).json({
      data: {
        reply: hasFallbackOptions ? `I couldn't find ${formatCuisineName(updatedPlan.cuisine)} recipes that match your current ingredients. What would you like to do?` : formatConversationReply(decision.suggestion, decision.followUpQuestion),
        action: hasFallbackOptions ? 'choose_fallback' : 'generate_recipe',
        plan: updatedPlan,
        followUpOptions: [],
        fallbackOptions: recipeResult.fallbackOptions,
        recipes: recipeResult.recipes,
      },
    });
  } catch (error) {
    if (isOllamaError(error, 'OLLAMA_UNAVAILABLE')) {
      response.status(503).json({
        error: {
          code: 'AI_PROVIDER_UNAVAILABLE',
          message: 'The recipe provider is temporarily unavailable. Please try again shortly.',
        },
      });
      return;
    }

    next(error);
  }
};
