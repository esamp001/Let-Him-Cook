import type { RecipeReaction } from '../community.types.js';

export interface RecipeFeedback {
  helpfulCount: number;
  notHelpfulCount: number;
  myReaction: RecipeReaction | null;
  hasOpenReport: boolean;
  isOwner: boolean;
}
