import type { GoogleOAuthChecks } from '../auth.types.js';

export interface GoogleAuthorizationRequest {
  url: URL;
  checks: GoogleOAuthChecks;
}
