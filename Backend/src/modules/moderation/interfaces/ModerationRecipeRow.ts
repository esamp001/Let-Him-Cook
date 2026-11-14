import type { CommunityRecipeRow } from '../../community/interfaces/CommunityRecipeRow.js';

export interface ModerationRecipeRow extends CommunityRecipeRow {
  author_name: string | null;
  open_report_count: string;
}
