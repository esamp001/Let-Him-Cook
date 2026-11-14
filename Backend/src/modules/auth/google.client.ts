import * as openIdClient from 'openid-client';
import { env } from '../../config/env.js';
import { googleClaimsSchema } from './auth.schemas.js';
import type { GoogleOAuthChecks } from './auth.types.js';
import type { GoogleAuthorizationRequest } from './interfaces/GoogleAuthorizationRequest.js';
import type { GoogleProfile } from './interfaces/GoogleProfile.js';

const googleIssuerUrl = new URL('https://accounts.google.com');

// Google's discovery document rarely changes, so it is loaded once per server process.
let googleConfiguration: openIdClient.Configuration | null = null;

const getGoogleConfiguration = async (): Promise<openIdClient.Configuration> => {
  googleConfiguration ??= await openIdClient.discovery(googleIssuerUrl, env.googleClientId, env.googleClientSecret);

  return googleConfiguration;
};

export const isGoogleSignInConfigured = (): boolean => env.googleClientId.length > 0 && env.googleClientSecret.length > 0;

export const createGoogleAuthorizationRequest = async (): Promise<GoogleAuthorizationRequest> => {
  const configuration = await getGoogleConfiguration();
  const codeVerifier = openIdClient.randomPKCECodeVerifier();
  const state = openIdClient.randomState();
  const nonce = openIdClient.randomNonce();

  const url = openIdClient.buildAuthorizationUrl(configuration, {
    redirect_uri: env.googleRedirectUri,
    scope: 'openid email profile',
    code_challenge: await openIdClient.calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
    state,
    nonce,
  });

  return { url, checks: { state, codeVerifier, nonce } };
};

export const getGoogleProfile = async (code: string, state: string, issuer: string, checks: GoogleOAuthChecks): Promise<GoogleProfile> => {
  const configuration = await getGoogleConfiguration();
  const callbackUrl = new URL(env.googleRedirectUri);
  callbackUrl.search = new URLSearchParams({ code, state, iss: issuer }).toString();

  // Verifies the issuer, state, PKCE verifier, nonce and ID token signature before returning tokens.
  const tokens = await openIdClient.authorizationCodeGrant(configuration, callbackUrl, {
    pkceCodeVerifier: checks.codeVerifier,
    expectedState: checks.state,
    expectedNonce: checks.nonce,
  });

  const claims = googleClaimsSchema.parse(tokens.claims());

  return {
    providerUserId: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified,
    name: claims.name ?? claims.email.split('@')[0],
  };
};
