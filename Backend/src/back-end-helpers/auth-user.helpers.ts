import type { AuthUser } from '../modules/auth/interfaces/AuthUser.js';
import type { UserRow } from '../modules/auth/interfaces/UserRow.js';

/**
 * Name: toAuthUser.
 * Returns: The public AuthUser shape without the password hash.
 * Parameters: user, a users row (the password hash is optional because most queries leave it out).
 * Description: Converts a database user row into the user object sent to the frontend and stored on response.locals.
 */
export const toAuthUser = (user: Omit<UserRow, 'password_hash'>): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  emailVerified: user.email_verified_at !== null,
});
