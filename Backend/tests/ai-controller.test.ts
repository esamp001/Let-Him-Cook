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
