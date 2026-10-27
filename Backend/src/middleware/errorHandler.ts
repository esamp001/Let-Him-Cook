import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);

  const details = error instanceof Error ? error.message : 'Unknown error';

  response.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      ...(env.nodeEnv === 'development' ? { details } : {}),
    },
  });
};
