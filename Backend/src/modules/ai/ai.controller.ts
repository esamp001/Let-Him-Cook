import type { RequestHandler } from 'express';
import { aiChatRequestSchema, aiRecipeRequestSchema, recipeDraftRequestSchema, type AiConversationDecision, type AiInitialChatModelResponse, type CookingPlan, type FallbackChoice } from './ai.types.js';
import { answerShownRecipeQuestion, decideConversationTurn, extractRecipeDraft, generateInitialChatTurn, generateRecipeSuggestions, resolveIngredientsToEnglish, selectExternalRecipeHighlights, updateConversationPlan } from './ollama.client.js';
import { getTheMealDbRecipeById, searchTheMealDbRecipes, searchTheMealDbRecipesByCuisine } from '../recipes/themealdb.client.js';
import type { ExternalRecipe } from '../recipes/interfaces/ExternalRecipe.js';
import { formatConversationReply, formatCuisineName, formatExternalRecipeExplanation, formatNoRecipeMatchReply, getFallbackOptions, isValidConversationDecision, isValidInitialChatTurn, normalizeIngredient, parseStructuredRecipeDraft, toExternalChatRecipe } from '../../back-end-helpers/ai-recipe.helpers.js';
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
    const highlights = await selectExternalRecipeHighlights(plan, externalRecipes.slice(0, 5));
    return { reply: formatExternalRecipeExplanation(plan, externalRecipes, highlights.recipeIds), recipes: externalRecipes.map((recipe) => toExternalChatRecipe(recipe, availableIngredients)), fallbackOptions: [] };
  }

  return { reply: '', recipes: [], fallbackOptions: getFallbackOptions(plan.cuisine) };
};

const getFallbackRecipes = async (plan: CookingPlan, choice: FallbackChoice) => {
  const availableIngredients = new Set(plan.ingredients.map(normalizeIngredient));

  if (choice === 'relax_ingredients') {
    const recipes = await searchTheMealDbRecipesByCuisine(plan.cuisine);
    const highlights = recipes.length > 0 ? await selectExternalRecipeHighlights(plan, recipes.slice(0, 5)) : null;
    return {
      reply: highlights
        ? formatExternalRecipeExplanation(plan, recipes, highlights.recipeIds)
        : `I still couldn't find ${formatCuisineName(plan.cuisine)} recipes from our recipe source.`,
      recipes: recipes.map((recipe) => toExternalChatRecipe(recipe, availableIngredients)),
    };
  }

  if (choice === 'relax_cuisine') {
    const recipes = await searchTheMealDbRecipes(plan.ingredients, 'any');
    const highlights = recipes.length > 0 ? await selectExternalRecipeHighlights(plan, recipes.slice(0, 5)) : null;
    return {
      reply: highlights
        ? formatExternalRecipeExplanation(plan, recipes, highlights.recipeIds)
        : 'I could not find source recipes for those ingredients.',
      recipes: recipes.map((recipe) => toExternalChatRecipe(recipe, availableIngredients)),
    };
  }

  throw new Error(`Unsupported recipe fallback choice: ${choice}`);
};

const getShownRecipeAnswer = async (message: string, shownRecipeIds: string[]) => {
  const shownRecipes: ExternalRecipe[] = [];

  for (const id of shownRecipeIds) {
    const recipe = await getTheMealDbRecipeById(id);
    if (recipe) shownRecipes.push(recipe);
  }

  const { answer } = await answerShownRecipeQuestion(message, shownRecipes);
  return answer;
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

  const { message, plan, fallbackChoice, shownRecipeIds } = parsedRequest.data;
  let shownRecipeAnswer: string;

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

      if (initialTurn.userIntent === 'answer_only') {
        shownRecipeAnswer = await getShownRecipeAnswer(message, shownRecipeIds);
        response.status(200).json({
          data: {
            reply: shownRecipeAnswer,
            action: 'answer',
            plan,
            followUpOptions: [],
            fallbackOptions: [],
            recipes: [],
          },
        });
        return;
      }

      const initialPlan = { ...initialTurn.plan, ingredients: await resolveIngredientsToEnglish(initialTurn.plan.ingredients), questionCount: 0 };

      if (initialTurn.userIntent === 'find_recipes_now') {
        const recipeResult = await getRecipesForPlan(initialPlan);
        const hasFallbackOptions = recipeResult.fallbackOptions.length > 0;

        response.status(200).json({
          data: {
            reply: hasFallbackOptions ? formatNoRecipeMatchReply(initialPlan.cuisine) : recipeResult.reply,
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

    if (planUpdate.userIntent === 'answer_only') {
      shownRecipeAnswer = await getShownRecipeAnswer(message, shownRecipeIds);
      response.status(200).json({
        data: {
          reply: shownRecipeAnswer,
          action: 'answer',
          plan,
          followUpOptions: [],
          fallbackOptions: [],
          recipes: [],
        },
      });
      return;
    }

    const updatedPlan = { ...planUpdate.plan, ingredients: await resolveIngredientsToEnglish(planUpdate.plan.ingredients), questionCount: plan.questionCount };
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
        reply: hasFallbackOptions ? formatNoRecipeMatchReply(updatedPlan.cuisine) : recipeResult.reply,
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

    if (isOllamaError(error, 'OLLAMA_INVALID_RESPONSE')) {
      response.status(502).json({
        error: {
          code: 'AI_PROVIDER_INVALID_RESPONSE',
          message: 'The recipe provider could not produce a valid response. Please try again.',
        },
      });
      return;
    }

    next(error);
  }
};
