import type { AiConversationDecision, AiInitialChatModelResponse, CookingPlan, RecipeDraft } from '../modules/ai/ai.types.js';
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

  if (generated.userIntent === 'answer_only') {
    return generated.followUpQuestion === null && generated.followUpOptions.length === 0;
  }

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
 * Description: Combines reply content with spacing only when a distinct question exists, so repeated model text appears once.
 */
export const formatConversationReply = (suggestion: string, followUpQuestion: string | null) => (
  followUpQuestion && followUpQuestion.trim().toLowerCase() !== suggestion.trim().toLowerCase() ? `${suggestion}\n\n${followUpQuestion}` : followUpQuestion ?? suggestion
);

/**
 * Name: formatExternalRecipeExplanation.
 * Returns: A conversational explanation containing only verified recipe facts.
 * Parameters: cooking plan, external recipes, and AI-selected recipe IDs.
 * Description: Validates selected IDs and describes ingredient matches computed from supplied data.
 */
export const formatExternalRecipeExplanation = (plan: CookingPlan, recipes: ExternalRecipe[], selectedRecipeIds: string[]) => {
  const selectedIdSet = new Set(selectedRecipeIds);
  const selectedRecipes = recipes.filter((recipe) => selectedIdSet.has(recipe.id)).slice(0, 2);
  const recipesToExplain = selectedRecipes.length > 0 ? selectedRecipes : recipes.slice(0, 2);
  const availableIngredients = new Set(plan.ingredients.map(normalizeIngredient));
  const explanations = recipesToExplain.map((recipe) => {
    const matchingIngredients = recipe.ingredients
      .map((ingredient) => ingredient.name)
      .filter((ingredient) => availableIngredients.has(normalizeIngredient(ingredient)));

    return matchingIngredients.length > 0
      ? `${recipe.title} includes ${matchingIngredients.join(', ')} from your ingredients.`
      : `${recipe.title} is one of the available recipe matches.`;
  });

  return `I found ${recipes.length} matching ${recipes.length === 1 ? 'recipe' : 'recipes'} for you. ${explanations.join(' ')}`;
};

/**
 * Name: formatCuisineName.
 * Returns: A user-friendly cuisine label.
 * Parameters: cuisine value from a cooking plan.
 * Description: Capitalizes named cuisines and formats any cuisine naturally.
 */
export const formatCuisineName = (cuisine: CookingPlan['cuisine']) => cuisine === 'any' ? 'any cuisine' : `${cuisine[0].toUpperCase()}${cuisine.slice(1)}`;

/**
 * Name: formatNoRecipeMatchReply.
 * Returns: A source-miss message appropriate for the requested cuisine.
 * Parameters: Cuisine from the current cooking plan.
 * Description: Explains that no sourced recipe matched before offering explicit fallback choices.
 */
export const formatNoRecipeMatchReply = (cuisine: CookingPlan['cuisine']) => cuisine === 'any'
  ? "I couldn't find source recipes that match your current ingredients. You can create your own version and save it to My recipes."
  : `I couldn't find ${formatCuisineName(cuisine)} recipes that match your current ingredients. What would you like to do?`;

/**
 * Name: getFallbackOptions.
 * Returns: Available fallback choices for a source search with no matches.
 * Parameters: requested cuisine.
 * Description: Offers relevant source-search alternatives and a path to create a personal recipe draft.
 */
export const getFallbackOptions = (cuisine: CookingPlan['cuisine']) => cuisine === 'any'
  ? [{ id: 'add_recipe' as const, label: 'Create your own version' }]
  : [
    { id: 'relax_ingredients' as const, label: `${formatCuisineName(cuisine)} recipes — extra ingredients OK` },
    { id: 'relax_cuisine' as const, label: 'Keep my ingredients — any cuisine' },
    { id: 'add_recipe' as const, label: 'Create your own version' },
  ];

/**
 * Name: toExternalChatRecipe.
 * Returns: An external recipe formatted for chat display.
 * Parameters: external recipe data and normalized available ingredients.
 * Description: Maps TheMealDB data and calculates owned and missing ingredients.
 */
export const toExternalChatRecipe = (externalRecipe: ExternalRecipe, availableIngredients: Set<string>) => ({
  id: externalRecipe.id,
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
