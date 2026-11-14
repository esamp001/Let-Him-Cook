import type { CommunityRecipeStatus } from '../community';
import type { BrowseRecipe } from './BrowseRecipe';

export interface CommunityRecipe extends BrowseRecipe {
  recipeId: string;
  status: CommunityRecipeStatus;
  helpfulCount: number;
  notHelpfulCount: number;
  submittedAt: string | null;
  publishedAt: string | null;
}
