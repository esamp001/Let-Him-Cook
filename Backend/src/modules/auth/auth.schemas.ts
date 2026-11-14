import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email().max(320);

const newPasswordSchema = z.string().min(8).max(128);

export const signUpRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: newPasswordSchema,
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(32).max(128),
  password: newPasswordSchema,
});

export const emailVerificationConfirmSchema = z.object({
  token: z.string().min(32).max(128),
});

export const signInRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  keepSignedIn: z.boolean().optional().default(false),
});

export const sessionTokenSchema = z.string().min(32).max(128);

export const googleCallbackQuerySchema = z.object({
  code: z.string().min(1).max(2_048),
  state: z.string().min(1).max(512),
  // Google adds the issuer (RFC 9207) so the client can confirm the response came from Google.
  iss: z.string().url().max(255),
});

export const googleStartQuerySchema = z.object({
  redirect: z.string().max(500).optional(),
});

export const googleOAuthChecksSchema = z.object({
  state: z.string().min(1).max(512),
  codeVerifier: z.string().min(1).max(512),
  nonce: z.string().min(1).max(512),
});

export const googleOAuthCookieSchema = googleOAuthChecksSchema.extend({
  redirectPath: z.string().max(500),
});

export const googleClaimsSchema = z.object({
  sub: z.string().min(1).max(255),
  email: emailSchema,
  email_verified: z.boolean(),
  name: z.string().trim().min(1).transform((name) => name.slice(0, 120)).optional(),
});
