import type { OllamaError } from './interfaces/OllamaError.js';

export type OllamaErrorCode = 'OLLAMA_UNAVAILABLE' | 'OLLAMA_INVALID_RESPONSE';

/**
 * Name: createOllamaError.
 * Returns: An OllamaError object.
 * Parameters: code, message, and an optional cause.
 * Description: Creates a functional error value for expected Ollama failures.
 */
export const createOllamaError = (code: OllamaErrorCode, message: string, cause?: unknown): OllamaError => ({
  code,
  message,
  ...(cause === undefined ? {} : { cause }),
});

/**
 * Name: isOllamaError.
 * Returns: True when the value is a supported OllamaError, optionally with the given code.
 * Parameters: error to inspect and an optional expected code.
 * Description: Safely narrows unknown caught values for functional error handling.
 */
export const isOllamaError = (error: unknown, code?: OllamaErrorCode): error is OllamaError => {
  if (!error || typeof error !== 'object' || !('code' in error) || !('message' in error)) return false;

  const candidate = error as { code?: unknown; message?: unknown };
  const hasKnownCode = candidate.code === 'OLLAMA_UNAVAILABLE' || candidate.code === 'OLLAMA_INVALID_RESPONSE';

  return hasKnownCode && typeof candidate.message === 'string' && (code === undefined || candidate.code === code);
};
