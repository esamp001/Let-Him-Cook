import type { CommunityRecipeStatus, ReportReason } from '../../community/community.types.js';
import type { ReportStatus } from '../moderation.types.js';

export interface RecipeReportItem {
  id: string;
  recipeId: string;
  recipeTitle: string;
  recipeStatus: CommunityRecipeStatus;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reporterName: string | null;
  createdAt: string;
}
