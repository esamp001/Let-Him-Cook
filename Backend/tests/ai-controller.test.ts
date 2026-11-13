import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { continueCookingConversation } from '../src/modules/ai/ai.controller.js';

test('a source miss offers the personal recipe creation path without generating an AI recipe', async () => {
  const originalFetch = globalThis.fetch;
  let ollamaRequestCount = 0;
  let responseBody: unknown;
  let responseStatus = 0;
  let nextError: unknown;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));

    if (url.pathname === '/api/generate') {
      ollamaRequestCount += 1;
      const generatedResponse = ollamaRequestCount === 1
        ? {
          userIntent: 'find_recipes_now',
          suggestion: 'I will look for recipes using pata.',
          followUpQuestion: null,
          followUpOptions: [],
          plan: { ingredients: ['pata'], cuisine: 'any', preferences: [] },
        }
        : { ingredients: ['pork hock'] };
      return new Response(JSON.stringify({
        response: JSON.stringify(generatedResponse),
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ meals: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const request = { body: { message: 'I only have pata. What can I make?' } } as Request;
  const expressResponse = {
    status: (status: number) => {
      responseStatus = status;
      return expressResponse;
    },
    json: (body: unknown) => {
      responseBody = body;
      return expressResponse;
    },
  } as unknown as Response;
  const next: NextFunction = (error?: unknown) => {
    nextError = error;
  };

  try {
    await continueCookingConversation(request, expressResponse, next);

    assert.equal(nextError, undefined);
    assert.equal(responseStatus, 200);
    assert.equal(ollamaRequestCount, 2);
    assert.deepEqual(responseBody, {
      data: {
        reply: "I couldn't find source recipes that match your current ingredients. You can create your own version and save it to My recipes.",
        action: 'choose_fallback',
        plan: { ingredients: ['pork hock'], cuisine: 'any', preferences: [], questionCount: 0 },
        followUpOptions: [],
        fallbackOptions: [{ id: 'add_recipe', label: 'Create your own version' }],
        recipes: [],
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a question about shown recipes is answered from recipe data without a new search', async () => {
  const originalFetch = globalThis.fetch;
  const ollamaPrompts: string[] = [];
  const mealDbPaths: string[] = [];
  let responseBody: unknown;
  let responseStatus = 0;
  let nextError: unknown;

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));

    if (url.pathname === '/api/generate') {
      ollamaPrompts.push(JSON.parse(String(init?.body)).prompt);
      const generatedResponse = ollamaPrompts.length === 1
        ? {
          userIntent: 'answer_only',
          suggestion: 'Let me check the cuisine of those recipes.',
          followUpQuestion: null,
          followUpOptions: [],
          plan: { ingredients: ['tofu'], cuisine: 'any', preferences: [] },
        }
        : { answer: 'No. Ma Po Tofu is listed as a Chinese recipe.' };
      return new Response(JSON.stringify({ response: JSON.stringify(generatedResponse) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    mealDbPaths.push(`${url.pathname}${url.search}`);
    return new Response(JSON.stringify({
      meals: [{ idMeal: '52814', strMeal: 'Ma Po Tofu', strArea: 'Chinese', strCategory: 'Beef', strInstructions: 'Cook the tofu.', strIngredient1: 'Tofu', strMeasure1: '450g' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const plan = { ingredients: ['tofu'], cuisine: 'any', preferences: [], questionCount: 0 };
  const request = { body: { message: 'Are these filipino foods?', plan, shownRecipeIds: ['52814'] } } as Request;
  const expressResponse = {
    status: (status: number) => {
      responseStatus = status;
      return expressResponse;
    },
    json: (body: unknown) => {
      responseBody = body;
      return expressResponse;
    },
  } as unknown as Response;
  const next: NextFunction = (error?: unknown) => {
    nextError = error;
  };

  try {
    await continueCookingConversation(request, expressResponse, next);

    assert.equal(nextError, undefined);
    assert.equal(responseStatus, 200);
    assert.equal(ollamaPrompts.length, 2);
    assert.match(ollamaPrompts[1], /"area":"Chinese"/);
    assert.equal(mealDbPaths.length, 1);
    assert.match(mealDbPaths[0], /lookup\.php\?i=52814/);
    assert.deepEqual(responseBody, {
      data: {
        reply: 'No. Ma Po Tofu is listed as a Chinese recipe.',
        action: 'answer',
        plan,
        followUpOptions: [],
        fallbackOptions: [],
        recipes: [],
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a follow-up question about shown recipes skips the decision step and the recipe search', async () => {
  const originalFetch = globalThis.fetch;
  const ollamaOperations: string[] = [];
  const mealDbPaths: string[] = [];
  let responseBody: unknown;
  let responseStatus = 0;
  let nextError: unknown;

  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));

    if (url.pathname === '/api/generate') {
      const prompt = String(JSON.parse(String(init?.body)).prompt);
      ollamaOperations.push(prompt.includes('cooking-plan extractor') ? 'plan update' : 'answer');
      const generatedResponse = ollamaOperations.length === 1
        ? { userIntent: 'answer_only', plan: { ingredients: ['tofu', 'pork'], cuisine: 'filipino', preferences: [] } }
        : { answer: 'No. Hot and Sour Soup is listed as a Chinese recipe.' };
      return new Response(JSON.stringify({ response: JSON.stringify(generatedResponse) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    mealDbPaths.push(`${url.pathname}${url.search}`);
    return new Response(JSON.stringify({
      meals: [{ idMeal: '52796', strMeal: 'Hot and Sour Soup', strArea: 'Chinese', strCategory: 'Pork', strInstructions: 'Simmer the soup.', strIngredient1: 'Tofu', strMeasure1: '200g' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const plan = { ingredients: ['tofu'], cuisine: 'any', preferences: [], questionCount: 1 };
  const request = { body: { message: 'Are these filipino foods?', plan, shownRecipeIds: ['52796'] } } as Request;
  const expressResponse = {
    status: (status: number) => {
      responseStatus = status;
      return expressResponse;
    },
    json: (body: unknown) => {
      responseBody = body;
      return expressResponse;
    },
  } as unknown as Response;
  const next: NextFunction = (error?: unknown) => {
    nextError = error;
  };

  try {
    await continueCookingConversation(request, expressResponse, next);

    assert.equal(nextError, undefined);
    assert.equal(responseStatus, 200);
    assert.deepEqual(ollamaOperations, ['plan update', 'answer']);
    assert.equal(mealDbPaths.length, 1);
    assert.match(mealDbPaths[0], /lookup\.php\?i=52796$/);
    assert.deepEqual(responseBody, {
      data: {
        reply: 'No. Hot and Sour Soup is listed as a Chinese recipe.',
        action: 'answer',
        plan,
        followUpOptions: [],
        fallbackOptions: [],
        recipes: [],
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('an unusable shown-recipe answer returns a provider error instead of a server error', async () => {
  const originalFetch = globalThis.fetch;
  let ollamaRequestCount = 0;
  let responseBody: unknown;
  let responseStatus = 0;
  let nextError: unknown;

  globalThis.fetch = async () => {
    ollamaRequestCount += 1;
    const generatedResponse = ollamaRequestCount === 1
      ? { userIntent: 'answer_only', plan: { ingredients: ['tofu'], cuisine: 'any', preferences: [] } }
      : { answer: 'x'.repeat(2_001) };
    return new Response(JSON.stringify({ response: JSON.stringify(generatedResponse) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const request = { body: { message: 'How long do I fry tofu?', plan: { ingredients: ['tofu'], cuisine: 'any', preferences: [], questionCount: 1 } } } as Request;
  const expressResponse = {
    status: (status: number) => {
      responseStatus = status;
      return expressResponse;
    },
    json: (body: unknown) => {
      responseBody = body;
      return expressResponse;
    },
  } as unknown as Response;
  const next: NextFunction = (error?: unknown) => {
    nextError = error;
  };

  try {
    await continueCookingConversation(request, expressResponse, next);

    assert.equal(nextError, undefined);
    assert.equal(responseStatus, 502);
    assert.deepEqual(responseBody, {
      error: {
        code: 'AI_PROVIDER_INVALID_RESPONSE',
        message: 'The recipe provider could not produce a valid response. Please try again.',
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
