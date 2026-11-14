import type { CommunityRecipeStatus, ReportReason } from '../../community/community.types.js';
import type { ReportStatus } from '../moderation.types.js';

export interface RecipeReportRow {
  id: string;
  recipe_id: string;
  recipe_title: string;
  recipe_status: CommunityRecipeStatus;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reporter_name: string | null;
  createdAt: Date;
}
