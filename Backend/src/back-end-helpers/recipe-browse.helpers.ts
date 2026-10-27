import type { BrowseRecipe } from '../modules/recipes/interfaces/BrowseRecipe.js';
import type { ExternalRecipe } from '../modules/recipes/interfaces/ExternalRecipe.js';

/**
 * Name: toMealDbBrowseRecipe.
 * Returns: A recipe formatted for the shared browse catalog.
 * Parameters: A normalized TheMealDB recipe.
 * Description: Preserves provider provenance while adapting meal details for the UI.
 */
export const toMealDbBrowseRecipe = (recipe: ExternalRecipe): BrowseRecipe => ({
  id: `themealdb:${recipe.id}`,
  title: recipe.title,
  description: recipe.area ? `${recipe.area} recipe from TheMealDB.` : 'Recipe from TheMealDB.',
  cuisine: recipe.area,
  imageUrl: recipe.imageUrl,
  cookingTimeMinutes: null,
  difficulty: null,
  ingredients: recipe.ingredients.map((ingredient) => ({ name: ingredient.name, quantity: ingredient.quantity || 'Not listed', isOptional: false })),
  steps: recipe.steps,
  source: 'themealdb',
  sourceUrl: null,
});

/**
 * Name: filterBrowseRecipes.
 * Returns: Recipes matching the requested catalog filters.
 * Parameters: Recipes, search text, cuisine, ingredient, and source.
 * Description: Applies browse filters after provider and community records are combined.
 */
export const filterBrowseRecipes = (recipes: BrowseRecipe[], search: string, cuisine: string, ingredient: string, source: string): BrowseRecipe[] => {
  const titleQuery = search.toLowerCase();
  const ingredientQuery = ingredient.toLowerCase();
  const cuisineQuery = cuisine.toLowerCase();

  return recipes.filter((recipe) => (
    (source === 'all' || recipe.source === source)
    && (cuisineQuery === 'any' || recipe.cuisine?.toLowerCase() === cuisineQuery)
    && (!titleQuery || recipe.title.toLowerCase().includes(titleQuery))
    && (!ingredientQuery || recipe.ingredients.some((item) => item.name.toLowerCase().includes(ingredientQuery)))
  ));
};
