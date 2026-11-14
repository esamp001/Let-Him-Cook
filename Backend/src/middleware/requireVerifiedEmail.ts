import type { RequestHandler } from 'express';

// Use after requireAuth for community actions that need a confirmed email address.
export const requireVerifiedEmail: RequestHandler = (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('requireVerifiedEmail must run after requireAuth.');
  }

  if (!authUser.emailVerified) {
    response.status(403).json({
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Verify your email address to do this. Check your inbox or resend the link.',
      },
    });
    return;
  }

  next();
};
