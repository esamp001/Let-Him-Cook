import assert from 'node:assert/strict';
import test from 'node:test';
import { isOllamaError } from '../src/back-end-helpers/ollama-error.helpers.js';
import { resolveIngredientsToEnglish } from '../src/modules/ai/ollama.client.js';

test('ingredient resolver translates every supplied ingredient in one request', async () => {
  const originalFetch = globalThis.fetch;
  let requestCount = 0;

  globalThis.fetch = async () => {
    requestCount += 1;
    return new Response(JSON.stringify({
      response: JSON.stringify({ ingredients: ['eggplant', 'chicken', 'tomato'] }),
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const ingredients = await resolveIngredientsToEnglish(['talong', 'manok', 'kamatis']);

    assert.deepEqual(ingredients, ['eggplant', 'chicken', 'tomato']);
    assert.equal(requestCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('ingredient resolver rejects a response that drops an ingredient', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response(JSON.stringify({
    response: JSON.stringify({ ingredients: ['eggplant', 'chicken'] }),
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  try {
    await assert.rejects(
      resolveIngredientsToEnglish(['talong', 'manok', 'kamatis']),
      (error: unknown) => isOllamaError(error, 'OLLAMA_INVALID_RESPONSE')
        && error.message === 'The ingredient resolver did not return one English ingredient for every supplied ingredient.',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
