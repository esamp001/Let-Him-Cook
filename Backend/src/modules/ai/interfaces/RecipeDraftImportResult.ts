import type { RecipeDraft } from '../ai.types.js';

export interface RecipeDraftImportResult {
  draft: RecipeDraft;
  mayBeIncomplete: boolean;
}
