import type { OllamaErrorCode } from '../ollama-error.helpers.js';

export interface OllamaError {
  code: OllamaErrorCode;
  message: string;
  cause?: unknown;
}
