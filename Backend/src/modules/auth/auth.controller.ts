import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { buildAuthLink, buildPasswordResetEmail, buildVerificationEmail } from '../../back-end-helpers/auth-email.helpers.js';
import { createSecretToken, getAuthTokenExpiresAt, getGoogleOAuthCookieOptions, getSessionCookieOptions, getSessionExpiresAt, googleOAuthCookieName, hashSecretToken, sessionCookieName } from '../../back-end-helpers/auth-session.helpers.js';
import { getSafeRedirectPath } from '../../back-end-helpers/auth-redirect.helpers.js';
import { toAuthUser } from '../../back-end-helpers/auth-user.helpers.js';
import { hashPassword, verifyPassword } from '../../back-end-helpers/password.helpers.js';
import { consumeAuthToken, createAuthToken, createSession, createUser, createUserWithIdentity, deleteSession, deleteUserSessions, findUserByEmail, findUserByIdentity, linkUserIdentity, markEmailVerified, updatePassword } from './auth.repository.js';
import { emailVerificationConfirmSchema, googleCallbackQuerySchema, googleOAuthCookieSchema, googleStartQuerySchema, passwordResetConfirmSchema, passwordResetRequestSchema, sessionTokenSchema, signInRequestSchema, signUpRequestSchema } from './auth.schemas.js';
import { sendEmail } from './email.client.js';
import { createGoogleAuthorizationRequest, getGoogleProfile, isGoogleSignInConfigured } from './google.client.js';
import type { AuthUser } from './interfaces/AuthUser.js';

const googleSignInFailedRedirect = '/Login?authError=google_failed';
const googleSignInUnavailableRedirect = '/Login?authError=google_unavailable';
const invalidTokenError = {
  error: {
    code: 'INVALID_OR_EXPIRED_TOKEN',
    message: 'This link is invalid or has expired. Request a new one.',
  },
} as const;

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

    const sessionToken = createSecretToken();
    await createSession(hashSecretToken(sessionToken), user.id, getSessionExpiresAt(false));
    response.cookie(sessionCookieName, sessionToken, getSessionCookieOptions(false));

    const verificationToken = createSecretToken();
    await createAuthToken(user.id, 'email_verification', hashSecretToken(verificationToken), getAuthTokenExpiresAt('email_verification'));

    // The account already exists, so a failed email is logged instead of failing sign-up; the user can resend it.
    sendEmail(buildVerificationEmail(user.email, user.name, buildAuthLink(env.appUrl, '/Verify-Email', verificationToken)))
      .catch((error: unknown) => console.error('Unable to send the verification email.', error));

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

    user = toAuthUser(existingUser);

    const sessionToken = createSecretToken();
    await createSession(hashSecretToken(sessionToken), user.id, getSessionExpiresAt(keepSignedIn));
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
      await deleteSession(hashSecretToken(parsedCookie.data));
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
        await markEmailVerified(existingUser.id);
        user = toAuthUser({ ...existingUser, email_verified_at: existingUser.email_verified_at ?? new Date() });
      } else {
        user = await createUserWithIdentity(profile.name, profile.email, 'google', profile.providerUserId);
      }
    }

    const sessionToken = createSecretToken();
    await createSession(hashSecretToken(sessionToken), user.id, getSessionExpiresAt(true));
    response.cookie(sessionCookieName, sessionToken, getSessionCookieOptions(true));

    // The cookie can be edited by the browser, so the path is checked again before redirecting.
    response.redirect(getSafeRedirectPath(redirectPath));
  } catch (error) {
    // This is a browser navigation, so send the user back to the login page instead of a JSON error.
    console.error(error);
    response.redirect(googleSignInFailedRedirect);
  }
};

export const signOutAllDevices: RequestHandler = async (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('signOutAllDevices must run after requireAuth.');
  }

  let signedOutSessions = 0;

  try {
    signedOutSessions = await deleteUserSessions(authUser.id);

    response.clearCookie(sessionCookieName, getSessionCookieOptions(false));
    response.status(200).json({ data: { signedOutSessions } });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset: RequestHandler = async (request, response, next) => {
  const parsedRequest = passwordResetRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Enter a valid email address.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { email } = parsedRequest.data;

  try {
    const user = await findUserByEmail(email);

    // The response is the same whether or not the account exists, so emails cannot be discovered here.
    if (user) {
      const resetToken = createSecretToken();
      await createAuthToken(user.id, 'password_reset', hashSecretToken(resetToken), getAuthTokenExpiresAt('password_reset'));
      await sendEmail(buildPasswordResetEmail(user.email, user.name, buildAuthLink(env.appUrl, '/Reset-Password', resetToken)));
    }

    response.status(200).json({ data: { message: 'If an account uses that email, a password reset link is on its way.' } });
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (request, response, next) => {
  const parsedRequest = passwordResetConfirmSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Choose a password of at least 8 characters.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { token, password } = parsedRequest.data;

  try {
    const userId = await consumeAuthToken(hashSecretToken(token), 'password_reset');

    if (!userId) {
      response.status(400).json(invalidTokenError);
      return;
    }

    await updatePassword(userId, await hashPassword(password));
    // Opening the emailed link proves the user owns the address.
    await markEmailVerified(userId);
    // A reset may follow a stolen password, so every existing session is signed out.
    await deleteUserSessions(userId);

    response.clearCookie(sessionCookieName, getSessionCookieOptions(false));
    response.status(200).json({ data: { passwordReset: true } });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail: RequestHandler = async (request, response, next) => {
  const parsedRequest = emailVerificationConfirmSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json(invalidTokenError);
    return;
  }

  const { token } = parsedRequest.data;

  try {
    const userId = await consumeAuthToken(hashSecretToken(token), 'email_verification');

    if (!userId) {
      response.status(400).json(invalidTokenError);
      return;
    }

    await markEmailVerified(userId);

    response.status(200).json({ data: { emailVerified: true } });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail: RequestHandler = async (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('resendVerificationEmail must run after requireAuth.');
  }

  if (authUser.emailVerified) {
    response.status(200).json({ data: { alreadyVerified: true } });
    return;
  }

  try {
    const verificationToken = createSecretToken();
    await createAuthToken(authUser.id, 'email_verification', hashSecretToken(verificationToken), getAuthTokenExpiresAt('email_verification'));
    await sendEmail(buildVerificationEmail(authUser.email, authUser.name, buildAuthLink(env.appUrl, '/Verify-Email', verificationToken)));

    response.status(200).json({ data: { sent: true } });
  } catch (error) {
    next(error);
  }
};
