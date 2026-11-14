import type { CommunityRecipeStatus, ReportReason, ReportStatus } from '../community';

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
