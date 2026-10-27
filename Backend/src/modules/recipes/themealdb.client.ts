import { env } from '../../config/env.js';
import { cuisineAreas, matchesCuisine, normalizeIngredientName, rankRecipes, readText, toExternalRecipe } from '../../back-end-helpers/themealdb-recipe.helpers.js';
import { mealDbResponseSchema } from './recipe.schemas.js';
import type { ExternalRecipe } from './interfaces/ExternalRecipe.js';

let ingredientNamesPromise: Promise<string[]> | null = null;
let browseRecipesCache: { expiresAt: number; recipes: ExternalRecipe[] } | null = null;
let browseRecipesPromise: Promise<ExternalRecipe[]> | null = null;
const browseCacheTtlMs = 60 * 60 * 1_000;
const mealDbAlphabet = 'abcdefghijklmnopqrstuvwxyz';

const getMeals = async (path: string) => {
  const response = await fetch(new URL(path, `${env.theMealDbBaseUrl}/`));

  if (!response.ok) {
    throw new Error(`TheMealDB returned status ${response.status}.`);
  }

  const payload = mealDbResponseSchema.parse(await response.json());
  return payload.meals ?? [];
};

const getTheMealDbIngredientNames = () => {
  if (!ingredientNamesPromise) {
    ingredientNamesPromise = getMeals('list.php?i=list')
      .then((ingredientList) => ingredientList
        .map((meal) => readText(meal, 'strIngredient'))
        .filter((candidate): candidate is string => candidate !== null));
  }

  return ingredientNamesPromise;
};

const findTheMealDbIngredient = async (ingredient: string) => {
  const requestedName = normalizeIngredientName(ingredient);
  const ingredientNames = await getTheMealDbIngredientNames();

  return ingredientNames.find((candidate) => normalizeIngredientName(candidate) === requestedName) ?? ingredient;
};

const searchMealSummariesByIngredient = async (requestedIngredient: string) => {
  let primaryIngredient = requestedIngredient.replace(/\s+/g, '_');
  let summaries = await getMeals(`filter.php?i=${encodeURIComponent(primaryIngredient)}`);

  if (summaries.length === 0) {
    // TheMealDB uses its own ingredient spelling. Resolve "sprout beans" to
    // "Bean Sprouts", for example, only when the original search has no match.
    const providerIngredient = await findTheMealDbIngredient(requestedIngredient);
    primaryIngredient = providerIngredient.replace(/\s+/g, '_');
    summaries = await getMeals(`filter.php?i=${encodeURIComponent(primaryIngredient)}`);
  }

  return summaries;
};

export const listTheMealDbRecipes = async (): Promise<ExternalRecipe[]> => {
  if (browseRecipesCache && browseRecipesCache.expiresAt > Date.now()) return browseRecipesCache.recipes;
  if (browseRecipesPromise) return browseRecipesPromise;

  browseRecipesPromise = (async () => {
    const recipes: ExternalRecipe[] = [];
    const seenIds = new Set<string>();

    for (const letter of mealDbAlphabet) {
      const meals = await getMeals(`search.php?f=${letter}`);
      for (const meal of meals) {
        const recipe = toExternalRecipe(meal);
        if (!recipe || recipe.ingredients.length === 0 || recipe.steps.length === 0 || seenIds.has(recipe.id)) continue;
        seenIds.add(recipe.id);
        recipes.push(recipe);
      }
    }

    browseRecipesCache = { expiresAt: Date.now() + browseCacheTtlMs, recipes };
    return recipes;
  })();

  try {
    return await browseRecipesPromise;
  } finally {
    browseRecipesPromise = null;
  }
};

export const searchTheMealDbRecipes = async (ingredients: string[], cuisine = 'any'): Promise<ExternalRecipe[]> => {
  const requestedIngredients = ingredients.map((ingredient) => ingredient.trim()).filter(Boolean);

  if (requestedIngredients.length === 0) return [];

  const summaryGroups: Awaited<ReturnType<typeof getMeals>>[] = [];

  for (const ingredient of requestedIngredients) {
    summaryGroups.push(await searchMealSummariesByIngredient(ingredient));
  }

  const ingredientMatchCounts = new Map<string, number>();
  // Create a Map where each recipe ID (string) maps to a match count (number).

  for (const summaries of summaryGroups) {
    // Loop through each group of meal summaries associated with an ingredient.

    const idsForIngredient = new Set(
      summaries
        .map((meal) => readText(meal, 'idMeal'))
        // Extract the meal ID from each summary.
        .filter((id): id is string => Boolean(id))
      // Remove missing or empty IDs and tell TypeScript the remaining IDs are strings.
    );
    // Store unique meal IDs for the current ingredient group.

    for (const id of idsForIngredient) {
      // Loop through each unique meal ID in the current ingredient group.

      ingredientMatchCounts.set(
        id,
        (ingredientMatchCounts.get(id) ?? 0) + 1
      );
      // Increment the count for this meal ID by 1.
    }
  }

  const ids = [...ingredientMatchCounts.keys()].sort((first, second) => (
    (ingredientMatchCounts.get(second) ?? 0) - (ingredientMatchCounts.get(first) ?? 0)
  ));

  const details: (ExternalRecipe | null)[] = [];
  for (const id of ids) {
    const meals = await getMeals(`lookup.php?i=${encodeURIComponent(id)}`);
    details.push(meals[0] ? toExternalRecipe(meals[0]) : null);
  }

  const recipes = details.filter((recipe): recipe is ExternalRecipe => Boolean(recipe && recipe.ingredients.length > 0 && recipe.steps.length > 0));
  return rankRecipes(recipes.filter((recipe) => matchesCuisine(recipe, cuisine)), cuisine, ingredientMatchCounts);
};

export const searchTheMealDbRecipesByCuisine = async (cuisine: string): Promise<ExternalRecipe[]> => {
  const areas = cuisineAreas[cuisine] ?? [];

  if (areas.length === 0) return [];

  const summaryGroups: Awaited<ReturnType<typeof getMeals>>[] = [];
  for (const area of areas) {
    summaryGroups.push(await getMeals(`filter.php?a=${encodeURIComponent(area)}`));
  }
  const ids = [...new Set(summaryGroups.flat().map((meal) => readText(meal, 'idMeal')).filter((id): id is string => Boolean(id)))];
  const details: (ExternalRecipe | null)[] = [];
  for (const id of ids) {
    const meals = await getMeals(`lookup.php?i=${encodeURIComponent(id)}`);
    details.push(meals[0] ? toExternalRecipe(meals[0]) : null);
  }

  return details
    .filter((recipe): recipe is ExternalRecipe => Boolean(recipe && recipe.ingredients.length > 0 && recipe.steps.length > 0))
    .filter((recipe) => matchesCuisine(recipe, cuisine));
};
