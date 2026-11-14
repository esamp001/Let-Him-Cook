import type { RequestHandler } from 'express';
import type { AuthUser } from '../modules/auth/interfaces/AuthUser.js';

// Use after requireAuth, for example: router.post('/...', requireAuth, requireRole('admin'), handler).
export const requireRole = (role: AuthUser['role']): RequestHandler => (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('requireRole must run after requireAuth.');
  }

  if (authUser.role !== role) {
    response.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this action.',
      },
    });
    return;
  }

  next();
};
