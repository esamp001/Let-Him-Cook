import type { RecipeReaction } from '../community';

export interface RecipeFeedback {
  helpfulCount: number;
  notHelpfulCount: number;
  myReaction: RecipeReaction | null;
  hasOpenReport: boolean;
  isOwner: boolean;
}
