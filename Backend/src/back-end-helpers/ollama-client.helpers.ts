import type { OllamaTimingPayload } from './interfaces/OllamaTimingPayload.js';

/**
 * Name: logOllamaTiming.
 * Returns: Nothing.
 * Parameters: operation label and Ollama timing payload.
 * Description: Logs generation timing and token information when Ollama provides it.
 */
export const logOllamaTiming = (operation: string, payload: OllamaTimingPayload) => {
  if (payload.total_duration === undefined) return;

  console.info('Ollama generation completed.', {
    operation,
    totalDurationMs: Math.round(payload.total_duration / 1_000_000),
    loadDurationMs: payload.load_duration === undefined ? undefined : Math.round(payload.load_duration / 1_000_000),
    promptTokens: payload.prompt_eval_count,
    generatedTokens: payload.eval_count,
  });
};

/**
 * Name: getRecipeCacheKey.
 * Returns: A normalized string cache key.
 * Parameters: user message and cuisine preference.
 * Description: Creates a stable key for caching equivalent recipe requests.
 */
export const getRecipeCacheKey = (message: string, cuisinePreference: string) => `${cuisinePreference}:${message.trim().replace(/\s+/g, ' ').toLowerCase()}`;

/**
 * Name: trimExpiredCacheEntries.
 * Returns: Nothing.
 * Parameters: cache entries with expiry times and the current timestamp.
 * Description: Removes expired values from a cache map in place.
 */
export const trimExpiredCacheEntries = <T extends { expiresAt: number }>(cache: Map<string, T>, now: number) => {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
};
