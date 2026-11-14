import type { z } from 'zod';
import type { googleOAuthChecksSchema } from './auth.schemas.js';

export type AuthProvider = 'google';
export type GoogleOAuthChecks = z.infer<typeof googleOAuthChecksSchema>;
