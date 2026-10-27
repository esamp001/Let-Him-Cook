import assert from 'node:assert/strict';
import test from 'node:test';
import { filterBrowseRecipes } from '../src/back-end-helpers/recipe-browse.helpers.js';
import { listTheMealDbRecipes } from '../src/modules/recipes/themealdb.client.js';
import type { BrowseRecipe } from '../src/modules/recipes/interfaces/BrowseRecipe.js';

test('browse filters preserve recipe source, cuisine, title, and ingredient matching', () => {
  const recipes: BrowseRecipe[] = [
    { id: 'themealdb:1', title: 'Chicken Adobo', description: '', cuisine: 'Filipino', imageUrl: null, cookingTimeMinutes: null, difficulty: null, ingredients: [{ name: 'Chicken', quantity: '1 kg', isOptional: false }], steps: ['Cook chicken.'], source: 'themealdb', sourceUrl: null },
    { id: 'community:2', title: 'Vegetable Adobo', description: '', cuisine: 'filipino', imageUrl: null, cookingTimeMinutes: null, difficulty: null, ingredients: [{ name: 'Eggplant', quantity: '1', isOptional: false }], steps: ['Cook eggplant.'], source: 'community', sourceUrl: null },
  ];

  assert.deepEqual(filterBrowseRecipes(recipes, 'adobo', 'filipino', 'eggplant', 'community').map((recipe) => recipe.id), ['community:2']);
  assert.deepEqual(filterBrowseRecipes(recipes, '', 'filipino', 'chicken', 'all').map((recipe) => recipe.id), ['themealdb:1']);
});

test('TheMealDB browse scans first letters once and caches the result', async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;

  globalThis.fetch = async (input) => {
    requestCount += 1;
    const url = new URL(String(input));
    const meals = url.searchParams.get('f') === 'a' ? [
      { idMeal: '53000', strMeal: 'Adobo', strArea: 'Filipino', strIngredient1: 'Chicken', strMeasure1: '1 kg', strInstructions: 'Cook chicken.' },
      { idMeal: '53001', strMeal: 'Incomplete Adobo', strArea: 'Filipino', strIngredient1: 'Chicken', strMeasure1: '1 kg', strInstructions: '' },
      { idMeal: '53002', strMeal: 'Missing Ingredients', strArea: 'Filipino', strInstructions: 'Cook chicken.' },
    ] : null;
    return new Response(JSON.stringify({ meals }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const first = await listTheMealDbRecipes();
    const second = await listTheMealDbRecipes();

    assert.equal(first.length, 1);
    assert.equal(first[0]?.title, 'Adobo');
    assert.equal(first[0]?.ingredients[0]?.name, 'Chicken');
    assert.equal(second, first);
    assert.equal(requestCount, 26);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
