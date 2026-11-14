import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import { env } from '../config/env.js';

export const sessionCookieName = 'lhc_session';
export const googleOAuthCookieName = 'lhc_google_oauth';

const dayInMilliseconds = 24 * 60 * 60 * 1_000;
const keepSignedInDays = 30;
const browserSessionDays = 1;
const googleOAuthCookieMaxAge = 10 * 60 * 1_000;
const authTokenLifetimeMinutes = {
  email_verification: 24 * 60,
  password_reset: 30
} as const;

/**
 * Name: createSecretToken.
 * Returns: A random, URL-safe secret token string.
 * Parameters: None.
 * Description: Generates the secret value for a session cookie or an emailed verification or password reset link.
 */
export const createSecretToken = (): string => randomBytes(32).toString('base64url');

/**
 * Name: hashSecretToken.
 * Returns: The SHA-256 hex digest of the token.
 * Parameters: secretToken, the raw token from a cookie or an emailed link.
 * Description: Hashes a secret token so the database never stores the raw value.
 */
export const hashSecretToken = (secretToken: string): string => createHash('sha256').update(secretToken).digest('hex');

/**
 * Name: getAuthTokenExpiresAt.
 * Returns: The Date when a new emailed token should expire.
 * Parameters: purpose, either 'email_verification' (24 hours) or 'password_reset' (30 minutes).
 * Description: Keeps password reset links short-lived while giving verification links a full day.
 */
export const getAuthTokenExpiresAt = (purpose: keyof typeof authTokenLifetimeMinutes): Date => new Date(Date.now() + authTokenLifetimeMinutes[purpose] * 60 * 1_000);

/**
 * Name: getSessionExpiresAt.
 * Returns: The Date when a new session should expire.
 * Parameters: keepSignedIn, whether the user asked to stay signed in.
 * Description: Gives long-lived sessions 30 days and browser sessions 1 day.
 */
export const getSessionExpiresAt = (keepSignedIn: boolean): Date => new Date(Date.now() + (keepSignedIn ? keepSignedInDays : browserSessionDays) * dayInMilliseconds);

/**
 * Name: getSessionCookieOptions.
 * Returns: Express cookie options for the session cookie.
 * Parameters: keepSignedIn, whether the cookie should outlive the browser session.
 * Description: Builds httpOnly, SameSite=Lax cookie options, secure in production, with a 30-day max age only when keepSignedIn is true.
 */
export const getSessionCookieOptions = (keepSignedIn: boolean): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  path: '/',
  ...(keepSignedIn ? { maxAge: keepSignedInDays * dayInMilliseconds } : {}),
});

/**
 * Name: getGoogleOAuthCookieOptions.
 * Returns: Express cookie options for the short-lived Google sign-in cookie.
 * Parameters: None.
 * Description: Scopes the state, PKCE verifier and nonce cookie to the Google auth routes for 10 minutes.
 */
export const getGoogleOAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  path: '/api/v1/auth/google',
  maxAge: googleOAuthCookieMaxAge,
});
