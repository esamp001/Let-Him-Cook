import type { RecipeDraft } from './RecipeDraft';

export interface RecipeDraftApiResponse {
  data?: { draft: RecipeDraft; importWarning?: string };
  error?: { message?: string };
}
