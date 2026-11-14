import type { AuthUser } from './AuthUser';

export interface AuthApiResponse {
  data?: { user: AuthUser };
  error?: { message?: string };
}
