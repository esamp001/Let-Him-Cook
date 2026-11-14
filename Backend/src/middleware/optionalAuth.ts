import type { RequestHandler } from 'express';
import { hashSecretToken, sessionCookieName } from '../back-end-helpers/auth-session.helpers.js';
import { findSessionUser } from '../modules/auth/auth.repository.js';
import { sessionTokenSchema } from '../modules/auth/auth.schemas.js';

// Loads the signed-in user when there is a valid session, but lets visitors through as well.
export const optionalAuth: RequestHandler = async (request, response, next) => {
  const parsedCookie = sessionTokenSchema.safeParse(request.cookies?.[sessionCookieName]);

  if (!parsedCookie.success) {
    next();
    return;
  }

  try {
    const authUser = await findSessionUser(hashSecretToken(parsedCookie.data));

    if (authUser) {
      response.locals.authUser = authUser;
    }

    next();
  } catch (error) {
    next(error);
  }
};
