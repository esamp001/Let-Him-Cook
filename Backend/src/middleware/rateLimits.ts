import { rateLimit } from 'express-rate-limit';

const minuteInMilliseconds = 60 * 1_000;

// Counts are kept in memory per server process, which is enough for the single-instance MVP.
const createRateLimit = (windowMinutes: number, limit: number, message: string) => rateLimit({
  windowMs: windowMinutes * minuteInMilliseconds,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message,
      },
    });
  },
});

export const signInRateLimit = createRateLimit(15, 10, 'Too many sign-in attempts. Try again in 15 minutes.');
export const signUpRateLimit = createRateLimit(60, 5, 'Too many accounts created from this network. Try again in an hour.');
export const accountEmailRateLimit = createRateLimit(15, 5, 'Too many email requests. Try again in 15 minutes.');
export const accountTokenRateLimit = createRateLimit(15, 20, 'Too many attempts. Try again in 15 minutes.');
