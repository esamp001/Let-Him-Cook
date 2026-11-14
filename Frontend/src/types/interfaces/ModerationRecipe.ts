import type { CommunityRecipe } from './CommunityRecipe';

export interface ModerationRecipe extends CommunityRecipe {
  authorName: string | null;
  openReportCount: number;
}
