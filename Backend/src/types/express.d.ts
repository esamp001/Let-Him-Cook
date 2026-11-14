import type { AuthUser } from '../modules/auth/interfaces/AuthUser.js';

// Adds the signed-in user that requireAuth stores on response.locals.
declare global {
  namespace Express {
    interface Locals {
      authUser?: AuthUser;
    }
  }
}

export {};
