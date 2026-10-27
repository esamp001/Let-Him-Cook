import type { AiConversationDecision, AiFinalChatRecipe, AiInitialChatModelResponse, CookingPlan, RecipeDraft } from '../modules/ai/ai.types.js';
import type { ExternalRecipe } from '../modules/recipes/interfaces/ExternalRecipe.js';

const proteinPattern = /\b(beef|chicken|pork|lamb|goat|veal|turkey|duck|shrimp|prawn|fish|salmon|tuna|seafood|egg|eggs|tofu|tempeh|beans|lentils|chickpeas)\b/i;
const draftCuisineValues = ['any', 'filipino', 'asian', 'italian', 'western', 'other'] as const;

/**
 * Name: normalizeIngredient.
 * Returns: A trimmed, lowercase ingredient name.
 * Parameters: ingredient text to normalize.
 * Description: Makes ingredient comparisons case- and whitespace-insensitive.
 */
export const normalizeIngredient = (ingredient: string) => ingredient.trim().toLowerCase();

/**
 * Name: planHasProtein.
 * Returns: True when the plan contains a protein ingredient.
 * Parameters: cooking plan to inspect.
 * Description: Prevents follow-up questions from asking for an already supplied protein.
 */
const planHasProtein = (plan: CookingPlan) => plan.ingredients.some((ingredient) => proteinPattern.test(ingredient));

/**
 * Name: asksForProtein.
 * Returns: True when a question or its options ask about protein.
 * Parameters: follow-up question and selectable options.
 * Description: Detects redundant protein questions from AI responses.
 */
const asksForProtein = (question: string | null, options: string[]) => proteinPattern.test([question, ...options].filter(Boolean).join(' ')) || /\bprotein\b/i.test(question ?? '');

/**
 * Name: getDraftCuisine.
 * Returns: A supported recipe-draft cuisine value.
 * Parameters: optional raw cuisine text.
 * Description: Normalizes recognized cuisine values and falls back to other.
 */
const getDraftCuisine = (rawCuisine: string | undefined): RecipeDraft['cuisine'] => {
  const normalizedCuisine = rawCuisine?.trim().toLowerCase();
  return draftCuisineValues.includes(normalizedCuisine as RecipeDraft['cuisine'])
    ? normalizedCuisine as RecipeDraft['cuisine']
    : 'other';
};

/**
 * Name: getCookingTimeMinutes.
 * Returns: Total cooking minutes or null.
 * Parameters: raw cooking-time text.
 * Description: Extracts hour and minute values from a recipe metadata line.
 */
const getCookingTimeMinutes = (rawText: string) => {
  const hours = Number(rawText.match(/(\d+)\s*(?:hours?|hrs?)/i)?.[1] ?? 0);
  const minutes = Number(rawText.match(/(\d+)\s*(?:minutes?|mins?)/i)?.[1] ?? 0);
  const total = (hours * 60) + minutes;
  return total > 0 ? total : null;
};

/**
 * Name: parseIngredient.
 * Returns: A structured ingredient with name, quantity, and optional flag.
 * Parameters: one ingredient-list line.
 * Description: Converts a simple bullet ingredient entry into recipe-draft data.
 */
const parseIngredient = (line: string) => {
  const cleaned = line.replace(/^[-*•]\s*/, '').trim();
  const optional = /,?\s*optional$/i.test(cleaned);
  const withoutOptional = cleaned.replace(/,?\s*optional$/i, '').trim();
  const quantityMatch = withoutOptional.match(/^((?:\d+(?:[/.]\d+)?|½|¼|¾|⅓|⅔)(?:\s*(?:kg|g|grams?|cups?|tablespoons?|tbsp\.?|teaspoons?|tsp\.?|cloves?|pieces?|medium|large|small|litres?|liters?|l|ml))?)\s+(.+)$/i);

  return {
    name: quantityMatch?.[2] ?? withoutOptional,
    quantity: quantityMatch?.[1] ?? 'Not specified',
    optional,
  };
};

/**
 * Name: parseStructuredRecipeDraft.
 * Returns: A recipe draft or null when the text is not structured enough.
 * Parameters: raw user-supplied recipe text.
 * Description: Parses titled ingredient bullets and numbered steps without AI.
 */
export const parseStructuredRecipeDraft = (rawText: string): RecipeDraft | null => {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const ingredientsIndex = lines.findIndex((line) => /^ingredients?:?$/i.test(line));
  const stepsIndex = lines.findIndex((line) => /^(instructions|steps|directions):?$/i.test(line));

  if (ingredientsIndex < 1 || stepsIndex <= ingredientsIndex + 1) return null;

  const title = lines.slice(0, ingredientsIndex).find((line) => !/^(cuisine|cooking time|difficulty):/i.test(line));
  const ingredientLines = lines.slice(ingredientsIndex + 1, stepsIndex).filter((line) => /^[-*•]/.test(line));
  const metadataIndex = lines.findIndex((line, index) => index > stepsIndex && /^(cuisine|cooking time|difficulty):/i.test(line));
  const stepLines = lines.slice(stepsIndex + 1, metadataIndex === -1 ? undefined : metadataIndex).filter((line) => /^\d+[.)]\s+/.test(line));

  if (!title || ingredientLines.length === 0 || stepLines.length === 0) return null;

  const cuisineLine = lines.find((line) => /^cuisine:/i.test(line));
  const cookingTimeLine = lines.find((line) => /^cooking time:/i.test(line));
  const difficultyLine = lines.find((line) => /^difficulty:/i.test(line));
  const difficulty = difficultyLine?.replace(/^difficulty:\s*/i, '').trim().toLowerCase();

  return {
    title,
    description: `${title} imported from your recipe text.`,
    cuisine: getDraftCuisine(cuisineLine?.replace(/^cuisine:\s*/i, '')),
    cookingTimeMinutes: getCookingTimeMinutes(cookingTimeLine?.replace(/^cooking time:\s*/i, '') ?? ''),
    difficulty: difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : difficulty === 'hard' ? 'Hard' : null,
    ingredients: ingredientLines.map(parseIngredient),
    steps: stepLines.map((line) => line.replace(/^\d+[.)]\s+/, '').trim()),
  };
};

/**
 * Name: isValidConversationDecision.
 * Returns: True when the AI decision obeys the conversation rules.
 * Parameters: AI decision and current cooking plan.
 * Description: Rejects incomplete follow-ups and redundant protein questions.
 */
export const isValidConversationDecision = (decision: AiConversationDecision, plan: CookingPlan) => {
  if (plan.questionCount >= 5 && decision.action !== 'generate_recipe') return false;
  if (decision.action === 'ask_follow_up') {
    return Boolean(decision.followUpQuestion)
      && decision.followUpOptions.length >= 2
      && !(planHasProtein(plan) && asksForProtein(decision.followUpQuestion, decision.followUpOptions));
  }

  return decision.followUpQuestion === null && decision.followUpOptions.length === 0;
};

/**
 * Name: isValidInitialChatTurn.
 * Returns: True when the first AI chat response follows expected rules.
 * Parameters: generated first turn and original user message.
 * Description: Validates intent, plan data, and follow-up requirements.
 */
export const isValidInitialChatTurn = (generated: AiInitialChatModelResponse, message: string) => {
  if (generated.suggestion.trim().toLowerCase() === message.trim().toLowerCase()) return false;

  const generatedPlan = { ...generated.plan, questionCount: 0 };

  if (generated.userIntent === 'find_recipes_now') {
    return generatedPlan.ingredients.length > 0
      && generated.followUpQuestion === null
      && generated.followUpOptions.length === 0;
  }

  return generatedPlan.ingredients.length === 0
    && Boolean(generated.followUpQuestion)
    && generated.followUpOptions.length >= 2
    && !(planHasProtein(generatedPlan) && asksForProtein(generated.followUpQuestion, generated.followUpOptions));
};

/**
 * Name: formatConversationReply.
 * Returns: A display-ready conversation reply.
 * Parameters: suggestion text and optional follow-up question.
 * Description: Combines reply content with spacing only when a question exists.
 */
export const formatConversationReply = (suggestion: string, followUpQuestion: string | null) => (
  followUpQuestion ? `${suggestion}\n\n${followUpQuestion}` : suggestion
);

/**
 * Name: formatCuisineName.
 * Returns: A user-friendly cuisine label.
 * Parameters: cuisine value from a cooking plan.
 * Description: Capitalizes named cuisines and formats any cuisine naturally.
 */
export const formatCuisineName = (cuisine: CookingPlan['cuisine']) => cuisine === 'any' ? 'any cuisine' : `${cuisine[0].toUpperCase()}${cuisine.slice(1)}`;

/**
 * Name: formatCuisineDescription.
 * Returns: A user-facing cuisine description.
 * Parameters: cuisine value from a cooking plan.
 * Description: Adds the word cuisine when needed for sentence text.
 */
export const formatCuisineDescription = (cuisine: CookingPlan['cuisine']) => cuisine === 'any' ? 'any cuisine' : `${formatCuisineName(cuisine)} cuisine`;

/**
 * Name: getFallbackOptions.
 * Returns: Available fallback choices for a cuisine-filtered search.
 * Parameters: requested cuisine.
 * Description: Creates labels for relaxing ingredients, cuisine, or using AI.
 */
export const getFallbackOptions = (cuisine: CookingPlan['cuisine']) => [
  { id: 'relax_ingredients' as const, label: `${formatCuisineName(cuisine)} recipes — extra ingredients OK` },
  { id: 'relax_cuisine' as const, label: 'Keep my ingredients — any cuisine' },
  { id: 'ai_recipe' as const, label: `Make an AI-generated ${formatCuisineName(cuisine)} recipe` },
];

/**
 * Name: toExternalChatRecipe.
 * Returns: An external recipe formatted for chat display.
 * Parameters: external recipe data and normalized available ingredients.
 * Description: Maps TheMealDB data and calculates owned and missing ingredients.
 */
export const toExternalChatRecipe = (externalRecipe: ExternalRecipe, availableIngredients: Set<string>) => ({
  title: externalRecipe.title,
  description: externalRecipe.area ? `${externalRecipe.area} recipe provided by TheMealDB.` : 'Recipe provided by TheMealDB.',
  cookingTimeMinutes: null,
  difficulty: null,
  ingredients: externalRecipe.ingredients.map((ingredient) => ({
    name: ingredient.name,
    quantity: ingredient.quantity || 'Not listed',
    optional: false,
  })),
  steps: externalRecipe.steps,
  videoSearchQuery: externalRecipe.title,
  recommendationReason: 'Found in TheMealDB using your cooking plan.',
  source: 'themealdb' as const,
  alreadyHave: externalRecipe.ingredients
    .filter((ingredient) => availableIngredients.has(normalizeIngredient(ingredient.name)))
    .map((ingredient) => ({ name: ingredient.name, quantity: ingredient.quantity || 'Not listed', optional: false })),
  missingIngredients: externalRecipe.ingredients
    .filter((ingredient) => !availableIngredients.has(normalizeIngredient(ingredient.name)))
    .map((ingredient) => ({ name: ingredient.name, quantity: ingredient.quantity || 'Not listed', optional: false })),
  imageUrl: externalRecipe.imageUrl,
});

/**
 * Name: toGeneratedChatRecipe.
 * Returns: An AI recipe formatted for chat display.
 * Parameters: generated recipe and normalized available ingredients.
 * Description: Adds source, owned ingredients, and required missing ingredients.
 */
export const toGeneratedChatRecipe = (recipe: AiFinalChatRecipe['recipe'], availableIngredients: Set<string>) => ({
  ...recipe,
  source: 'ai-generated' as const,
  alreadyHave: recipe.ingredients.filter((ingredient) => availableIngredients.has(normalizeIngredient(ingredient.name))),
  missingIngredients: recipe.ingredients.filter((ingredient) => !ingredient.optional && !availableIngredients.has(normalizeIngredient(ingredient.name))),
});
