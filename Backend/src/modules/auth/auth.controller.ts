import type { RequestHandler } from 'express';
import { createSessionToken, getGoogleOAuthCookieOptions, getSessionCookieOptions, getSessionExpiresAt, googleOAuthCookieName, hashSessionToken, sessionCookieName } from '../../back-end-helpers/auth-session.helpers.js';
import { getSafeRedirectPath } from '../../back-end-helpers/auth-redirect.helpers.js';
import { hashPassword, verifyPassword } from '../../back-end-helpers/password.helpers.js';
import { createSession, createUser, createUserWithIdentity, deleteSession, findUserByEmail, findUserByIdentity, linkUserIdentity } from './auth.repository.js';
import { googleCallbackQuerySchema, googleOAuthCookieSchema, googleStartQuerySchema, sessionTokenSchema, signInRequestSchema, signUpRequestSchema } from './auth.schemas.js';
import { createGoogleAuthorizationRequest, getGoogleProfile, isGoogleSignInConfigured } from './google.client.js';
import type { AuthUser } from './interfaces/AuthUser.js';

const googleSignInFailedRedirect = '/Login?authError=google_failed';
const googleSignInUnavailableRedirect = '/Login?authError=google_unavailable';

export const signUp: RequestHandler = async (request, response, next) => {
  const parsedRequest = signUpRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Enter your name, a valid email, and a password of at least 8 characters.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { name, email, password } = parsedRequest.data;

  let user: AuthUser;

  try {
    if (await findUserByEmail(email)) {
      response.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email already exists. Sign in instead.',
        },
      });
      return;
    }

    user = await createUser(name, email, await hashPassword(password));

    const sessionToken = createSessionToken();
    await createSession(hashSessionToken(sessionToken), user.id, getSessionExpiresAt(false));
    response.cookie(sessionCookieName, sessionToken, getSessionCookieOptions(false));

    response.status(201).json({ data: { user } });
  } catch (error) {
    next(error);
  }
};

export const signIn: RequestHandler = async (request, response, next) => {
  const parsedRequest = signInRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Enter a valid email and password.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { email, password, keepSignedIn } = parsedRequest.data;

  let user: AuthUser;

  try {
    const existingUser = await findUserByEmail(email);

    // Accounts created with Google have no password, so they fail here like a wrong password.
    if (!existingUser?.password_hash || !(await verifyPassword(password, existingUser.password_hash))) {
      response.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect email or password.',
        },
      });
      return;
    }

    user = { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role };

    const sessionToken = createSessionToken();
    await createSession(hashSessionToken(sessionToken), user.id, getSessionExpiresAt(keepSignedIn));
    response.cookie(sessionCookieName, sessionToken, getSessionCookieOptions(keepSignedIn));

    response.status(200).json({ data: { user } });
  } catch (error) {
    next(error);
  }
};

export const signOut: RequestHandler = async (request, response, next) => {
  const parsedCookie = sessionTokenSchema.safeParse(request.cookies?.[sessionCookieName]);

  try {
    if (parsedCookie.success) {
      await deleteSession(hashSessionToken(parsedCookie.data));
    }

    response.clearCookie(sessionCookieName, getSessionCookieOptions(false));
    response.status(200).json({ data: { signedOut: true } });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser: RequestHandler = (_request, response) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('getCurrentUser must run after requireAuth.');
  }

  response.status(200).json({ data: { user: authUser } });
};

export const startGoogleSignIn: RequestHandler = async (request, response, next) => {
  if (!isGoogleSignInConfigured()) {
    response.redirect(googleSignInUnavailableRedirect);
    return;
  }

  const parsedQuery = googleStartQuerySchema.safeParse(request.query);
  const redirectPath = getSafeRedirectPath(parsedQuery.success ? parsedQuery.data.redirect : undefined);

  try {
    const { url, checks } = await createGoogleAuthorizationRequest();

    // The page to return to rides along with the sign-in checks until Google sends the user back.
    response.cookie(googleOAuthCookieName, { ...checks, redirectPath }, getGoogleOAuthCookieOptions());
    response.redirect(url.href);
  } catch (error) {
    next(error);
  }
};

export const finishGoogleSignIn: RequestHandler = async (request, response) => {
  const parsedQuery = googleCallbackQuerySchema.safeParse(request.query);
  const parsedCookie = googleOAuthCookieSchema.safeParse(request.cookies?.[googleOAuthCookieName]);

  response.clearCookie(googleOAuthCookieName, getGoogleOAuthCookieOptions());

  // A missing code means the user cancelled on Google; a missing cookie means the sign-in expired.
  if (!parsedQuery.success || !parsedCookie.success) {
    response.redirect(googleSignInFailedRedirect);
    return;
  }

  const { code, state, iss } = parsedQuery.data;
  const { redirectPath, ...checks } = parsedCookie.data;

  let user: AuthUser | undefined;

  try {
    const profile = await getGoogleProfile(code, state, iss, checks);

    if (!profile.emailVerified) {
      response.redirect(googleSignInFailedRedirect);
      return;
    }

    user = await findUserByIdentity('google', profile.providerUserId);

    if (!user) {
      const existingUser = await findUserByEmail(profile.email);

      if (existingUser) {
        // Google verified this email, so it is safe to link it to the existing account.
        await linkUserIdentity(existingUser.id, 'google', profile.providerUserId, profile.email);
        user = { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role };
      } else {
        user = await createUserWithIdentity(profile.name, profile.email, 'google', profile.providerUserId);
      }
    }

    const sessionToken = createSessionToken();
    await createSession(hashSessionToken(sessionToken), user.id, getSessionExpiresAt(true));
    response.cookie(sessionCookieName, sessionToken, getSessionCookieOptions(true));

    // The cookie can be edited by the browser, so the path is checked again before redirecting.
    response.redirect(getSafeRedirectPath(redirectPath));
  } catch (error) {
    // This is a browser navigation, so send the user back to the login page instead of a JSON error.
    console.error(error);
    response.redirect(googleSignInFailedRedirect);
  }
};
