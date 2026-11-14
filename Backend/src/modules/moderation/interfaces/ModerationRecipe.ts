import type { CommunityRecipe } from '../../community/interfaces/CommunityRecipe.js';

export interface ModerationRecipe extends CommunityRecipe {
  authorName: string | null;
  openReportCount: number;
}
