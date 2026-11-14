import type { BrowseRecipe } from '../../recipes/interfaces/BrowseRecipe.js';
import type { CommunityRecipeStatus } from '../community.types.js';

export interface CommunityRecipe extends BrowseRecipe {
  recipeId: string;
  status: CommunityRecipeStatus;
  helpfulCount: number;
  notHelpfulCount: number;
  submittedAt: string | null;
  publishedAt: string | null;
}
