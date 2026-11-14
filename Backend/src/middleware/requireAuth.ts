import type { RequestHandler } from 'express';
import { hashSessionToken, sessionCookieName } from '../back-end-helpers/auth-session.helpers.js';
import { findSessionUser } from '../modules/auth/auth.repository.js';
import { sessionTokenSchema } from '../modules/auth/auth.schemas.js';

const unauthenticatedError = {
  error: {
    code: 'UNAUTHENTICATED',
    message: 'Sign in to continue.',
  },
} as const;

export const requireAuth: RequestHandler = async (request, response, next) => {
  const parsedCookie = sessionTokenSchema.safeParse(request.cookies?.[sessionCookieName]);

  if (!parsedCookie.success) {
    response.status(401).json(unauthenticatedError);
    return;
  }

  try {
    const authUser = await findSessionUser(hashSessionToken(parsedCookie.data));

    if (!authUser) {
      response.status(401).json(unauthenticatedError);
      return;
    }

    response.locals.authUser = authUser;
    next();
  } catch (error) {
    next(error);
  }
};
