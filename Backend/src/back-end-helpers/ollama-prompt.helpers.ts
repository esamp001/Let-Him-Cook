import type { CookingPlan, CuisinePreference } from '../modules/ai/ai.types.js';
import type { ExternalRecipe } from '../modules/recipes/interfaces/ExternalRecipe.js';

const proteinPattern = /\b(beef|chicken|pork|lamb|goat|veal|turkey|duck|shrimp|prawn|fish|salmon|tuna|seafood|egg|eggs|tofu|tempeh|beans|lentils|chickpeas)\b/i;

/**
 * Name: hasProteinInPlan.
 * Returns: True when the cooking plan includes a protein ingredient.
 * Parameters: cooking plan to inspect.
 * Description: Detects protein so prompts do not ask the user to choose one again.
 */
const hasProteinInPlan = (plan: CookingPlan) => plan.ingredients.some((ingredient) => proteinPattern.test(ingredient));

/**
 * Name: buildRecipeSuggestionPrompt.
 * Returns: A recipe-suggestion prompt string.
 * Parameters: user message and cuisine preference.
 * Description: Instructs Ollama to generate concise, structured recipe suggestions.
 */
export const buildRecipeSuggestionPrompt = (message: string, cuisinePreference: CuisinePreference) => `
You are Let Him Cook, an AI cooking assistant.
Interpret the user's request and generate up to two practical recipe suggestions.
Return only JSON that conforms to the supplied schema. Do not include Markdown or explanations outside the JSON object.
All recipes are AI-generated suggestions, not sourced or verified recipes.
Do not claim a recipe source, video URL, current price, nutrition value, or allergy safety.
For each recipe, provide a realistic videoSearchQuery, not a video link.
Prefer the user's available ingredients, easy steps, and their constraints. Keep each recipe concise: no more than 12 ingredients and 6 short steps.
Selected cuisine preference: ${cuisinePreference}.
Use the selected cuisine preference when it is not "any". If the user explicitly requests another cuisine in their message, follow the user's explicit request instead.

User message: ${message}
`.trim();

/**
 * Name: buildPlanUpdatePrompt.
 * Returns: A plan-update prompt string.
 * Parameters: latest message, current plan, and retry flag.
 * Description: Instructs Ollama to extract only plan facts from the latest message.
 */
export const buildPlanUpdatePrompt = (message: string, plan: CookingPlan, isRetry: boolean) => `
You are Let Him Cook, a cooking-plan extractor.
Return only JSON that conforms to the supplied schema. Do not include Markdown or text outside the JSON.

Update plan using only facts clearly stated in the latest user message. Preserve useful facts from the current plan, but explicit new information always overrides old values. For example, if the user says Filipino, set cuisine to "filipino"; if they say Asian, Italian, or Western, use the matching cuisine enum.

Set userIntent to "question" when the user asks for an idea, advice, or another suggestion. Set it to "preference_response" when they answer the assistant's prior question with a cuisine, style, protein, time, budget, or other preference. Do not write a reply, choose an action, or generate a recipe.

Current plan: ${JSON.stringify(plan)}
Latest user message: ${message}

${isRetry ? 'Your previous plan update was invalid. Return only a complete corrected plan.' : ''}
`.trim();

/**
 * Name: buildConversationDecisionPrompt.
 * Returns: A conversation-decision prompt string.
 * Parameters: cooking plan, user intent, and retry flag.
 * Description: Instructs Ollama to ask a useful question or generate a recipe.
 */
export const buildConversationDecisionPrompt = (plan: CookingPlan, userIntent: 'question' | 'preference_response', isRetry: boolean) => `
You are Let Him Cook, a friendly conversational cooking assistant.
Return only JSON that conforms to the supplied schema. Do not include Markdown or text outside the JSON.

Based on the cooking plan and latest user intent, choose one action. If latest user intent is "preference_response", action MUST be generate_recipe. If it is "question", give a useful suggestion and then use ask_follow_up when another preference would materially improve the recipe. If questionCount is 5, action MUST be generate_recipe.

suggestion must always answer the user's cooking need first with a practical idea. When action is ask_follow_up, followUpQuestion must be one helpful question about a missing preference, such as available protein, seasonings, cooking time, or dish style. followUpOptions must contain 2 to 6 short, selectable answers to that exact question. Never ask the user to repeat or choose a type of ingredient already listed in the plan. When action is generate_recipe, followUpQuestion MUST be null and followUpOptions MUST be an empty array. Never quote or repeat a user message.

${hasProteinInPlan(plan) ? 'Important: the plan already contains a protein. Do NOT ask which protein to use and do NOT offer protein choices. Ask about a different useful detail such as seasonings, cooking method, time, spice level, or dish style.' : ''}

Cooking plan: ${JSON.stringify(plan)}
Latest user intent: ${userIntent}
${isRetry ? 'Your previous decision was invalid. Return a valid new decision.' : ''}
`.trim();

/**
 * Name: buildFinalRecipePrompt.
 * Returns: A final-recipe prompt string.
 * Parameters: cooking plan and retry flag.
 * Description: Instructs Ollama to generate one concise recipe from the plan.
 */
export const buildFinalRecipePrompt = (plan: CookingPlan, isRetry: boolean) => `
You are Let Him Cook, an AI cooking assistant.
Return only JSON that conforms to the supplied schema. Do not include Markdown or text outside the JSON.

Generate exactly one practical recipe based on this cooking plan. Prefer its ingredients and cuisine. Keep it concise: at most 12 ingredients and 6 short steps. Do not claim a source, video URL, price, nutrition value, or allergy safety.

Cooking plan: ${JSON.stringify(plan)}
${isRetry ? 'Your previous recipe response was invalid. Return one complete valid recipe.' : ''}
`.trim();

/**
 * Name: buildExternalRecipeSelectionPrompt.
 * Returns: An external-recipe selection prompt string.
 * Parameters: cooking plan and available external recipes.
 * Description: Instructs Ollama to select one supplied recipe without inventing data.
 */
export const buildExternalRecipeSelectionPrompt = (plan: CookingPlan, recipes: ExternalRecipe[]) => `
You are Let Him Cook, a cooking assistant.
Return only JSON that conforms to the supplied schema. Select exactly one recipeId from the supplied recipe candidates. Do not invent a recipe ID, title, ingredient, or source. reply should briefly explain why the selected recipe fits the cooking plan.

Cooking plan: ${JSON.stringify(plan)}
Recipe candidates: ${JSON.stringify(recipes.map((recipe) => ({ id: recipe.id, title: recipe.title, area: recipe.area, category: recipe.category, ingredients: recipe.ingredients.map((ingredient) => ingredient.name) })))}
`.trim();

/**
 * Name: buildRecipeDraftPrompt.
 * Returns: A recipe-draft extraction prompt string.
 * Parameters: raw recipe text from the user.
 * Description: Instructs Ollama to extract only stated recipe facts into a draft.
 */
export const buildRecipeDraftPrompt = (rawText: string) => `
You are Let Him Cook's private-recipe importer.
Turn the user's supplied recipe text into a structured recipe draft. Return only JSON that conforms to the supplied schema.

Use only facts found in the supplied text. Do not invent ingredients, quantities, times, temperatures, or cooking steps. Use "Not specified" for a missing ingredient quantity, null for unavailable cookingTimeMinutes or difficulty, and mark an ingredient optional only when the text says it is optional. Classify cuisine only when the recipe name or text makes it clear; otherwise use "other".

The user will review and edit this draft before saving it. Keep the description to one short sentence.

Use at most 20 ingredients and 12 short steps.

Recipe text:
${rawText}
`.trim();

/**
 * Name: buildInitialChatPrompt.
 * Returns: An initial-chat prompt string.
 * Parameters: first user message, current plan, and retry flag.
 * Description: Instructs Ollama to classify the first turn and initialize the plan.
 */
export const buildInitialChatPrompt = (message: string, plan: CookingPlan, isRetry: boolean) => `
You are Let Him Cook, a friendly conversational cooking assistant.
Return only JSON that conforms to the supplied schema. Do not include Markdown or text outside the JSON.

This is the first message in a cooking-planning conversation. Extract only the user's clearly stated ingredients and preferences into plan.

Set userIntent to "find_recipes_now" when the user provides one or more available ingredients and asks what they can cook, especially when they say those are the only ingredients they have. For this intent, do not ask any follow-up question: followUpQuestion MUST be null, followUpOptions MUST be an empty array, and suggestion should briefly say that matching recipes are being shown.

Set userIntent to "needs_clarification" only when the request does not contain enough information to search for recipes, such as "I want to cook something tonight." For this intent, provide one natural follow-up question and 2 to 6 short selectable answers in followUpOptions.

Do not repeat, quote, or paraphrase the user's message. Do not generate a full recipe.

Current plan: ${JSON.stringify(plan)}
Latest user message: ${message}

Now return the JSON response. Do not ask questions when userIntent is "find_recipes_now".
${isRetry ? 'Your previous response was invalid. Return a different valid follow-up question.' : ''}
`.trim();
