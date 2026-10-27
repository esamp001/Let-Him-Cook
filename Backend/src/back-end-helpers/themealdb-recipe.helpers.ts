import type { ExternalRecipe } from '../modules/recipes/interfaces/ExternalRecipe.js';
import type { ExternalRecipeIngredient } from '../modules/recipes/interfaces/ExternalRecipeIngredient.js';

export const cuisineAreas: Record<string, readonly string[]> = {
  filipino: ['filipino'],
  asian: ['chinese', 'japanese', 'korean', 'malaysian', 'thai', 'vietnamese', 'indian'],
  italian: ['italian'],
  western: ['american', 'british', 'canadian', 'french', 'greek', 'irish', 'spanish'],
} as const;

/**
 * Name: readText.
 * Returns: A trimmed string or null when the field is empty or not text.
 * Parameters: meal record and field key.
 * Description: Reads a text field from an untrusted TheMealDB record.
 */
export const readText = (meal: Record<string, unknown>, key: string) => {
  const value = meal[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/**
 * Name: splitInstructions.
 * Returns: An array of nonempty cooking steps.
 * Parameters: instruction text or null.
 * Description: Separates provider instructions at line breaks and sentence boundaries.
 */
const splitInstructions = (instructions: string | null) => (
  instructions
    ? instructions.split(/\r?\n|(?<=[.!?])\s+(?=[A-Z])/).map((step) => step.trim()).filter(Boolean)
    : []
);

/**
 * Name: extractIngredients.
 * Returns: The populated ingredient names and measurements.
 * Parameters: meal record with numbered ingredient and measure fields.
 * Description: Collects up to 20 TheMealDB ingredient fields into structured data.
 */
const extractIngredients = (meal: Record<string, unknown>): ExternalRecipeIngredient[] => (
  Array.from({ length: 20 }, (_, index) => index + 1)
    .map((index) => ({
      name: readText(meal, `strIngredient${index}`),
      quantity: readText(meal, `strMeasure${index}`) ?? '',
    }))
    .filter((ingredient): ingredient is ExternalRecipeIngredient & { name: string } => Boolean(ingredient.name))
);

/**
 * Name: toExternalRecipe.
 * Returns: A normalized recipe or null when its ID or title is missing.
 * Parameters: raw TheMealDB meal record.
 * Description: Maps provider fields into the application's external recipe shape.
 */
export const toExternalRecipe = (meal: Record<string, unknown>): ExternalRecipe | null => {
  const id = readText(meal, 'idMeal');
  const title = readText(meal, 'strMeal');

  if (!id || !title) return null;

  return {
    id,
    title,
    area: readText(meal, 'strArea'),
    category: readText(meal, 'strCategory'),
    imageUrl: readText(meal, 'strMealThumb'),
    ingredients: extractIngredients(meal),
    steps: splitInstructions(readText(meal, 'strInstructions')),
  };
};

/**
 * Name: normalizeIngredientName.
 * Returns: A sorted, singularized ingredient name.
 * Parameters: ingredient text to normalize.
 * Description: Matches differently ordered or pluralized provider ingredient names.
 */
export const normalizeIngredientName = (ingredient: string) => ingredient
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter(Boolean)
  .map((word) => word.endsWith('s') ? word.slice(0, -1) : word)
  .sort()
  .join(' ');

/**
 * Name: matchesCuisine.
 * Returns: Whether the recipe's area matches the requested cuisine.
 * Parameters: external recipe and requested cuisine.
 * Description: Applies the supported TheMealDB area filter, including any cuisine.
 */
export const matchesCuisine = (recipe: ExternalRecipe, cuisine: string) => {
  if (cuisine === 'any') return true;
  return (cuisineAreas[cuisine] ?? []).includes(recipe.area?.toLowerCase() ?? '');
};

/**
 * Name: rankRecipes.
 * Returns: A new recipe array sorted by ingredient matches and preferred area.
 * Parameters: recipes, requested cuisine, and match counts by recipe ID.
 * Description: Ranks candidate recipes while preserving the input array.
 */
export const rankRecipes = (recipes: ExternalRecipe[], cuisine: string, ingredientMatchCounts: Map<string, number>) => {
  const preferredAreas = cuisineAreas[cuisine] ?? [];

  return [...recipes].sort((first, second) => {
    const ingredientDifference = (ingredientMatchCounts.get(second.id) ?? 0) - (ingredientMatchCounts.get(first.id) ?? 0);

    if (ingredientDifference !== 0) return ingredientDifference;

    const firstMatches = preferredAreas.includes(first.area?.toLowerCase() ?? '') ? 1 : 0;
    const secondMatches = preferredAreas.includes(second.area?.toLowerCase() ?? '') ? 1 : 0;
    return secondMatches - firstMatches;
  });
};
