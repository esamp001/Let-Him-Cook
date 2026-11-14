export type CommunityRecipeStatus = 'private' | 'pending_review' | 'published' | 'needs_review' | 'unpublished' | 'rejected';
export type RecipeReaction = 'helpful' | 'not_helpful';
export type ReportReason = 'incorrect_recipe' | 'not_filipino' | 'unsafe' | 'spam' | 'copyright' | 'other';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type ModerationAction = 'approve' | 'reject' | 'unpublish' | 'restore';
