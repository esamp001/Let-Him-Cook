import type { CommunityRecipeStatus } from '../modules/community/community.types.js';
import type { ModerationAction } from '../modules/moderation/moderation.types.js';

// A published recipe goes back to moderators after this many open reports from different users.
export const openReportFlagThreshold = 3;
// ...or after this many "not helpful" reactions when they also outnumber "helpful" ones.
export const notHelpfulFlagMinimum = 5;

const allowedTransitions: Record<ModerationAction, { from: readonly CommunityRecipeStatus[]; to: CommunityRecipeStatus }> = {
  approve: { from: ['pending_review', 'needs_review'], to: 'published' },
  reject: { from: ['pending_review', 'needs_review'], to: 'rejected' },
  unpublish: { from: ['published', 'needs_review'], to: 'unpublished' },
  restore: { from: ['unpublished', 'needs_review'], to: 'published' },
};

const submittableStatuses: readonly CommunityRecipeStatus[] = ['private', 'rejected', 'unpublished'];

// The recipe_moderation_events.action value recorded for each moderator action.
export const moderationEventActions = {
  approve: 'approved',
  reject: 'rejected',
  unpublish: 'unpublished',
  restore: 'restored'
} as const;

// Statuses shown in the moderation queue when no status filter is chosen.
export const defaultModerationQueueStatuses: readonly CommunityRecipeStatus[] = ['pending_review', 'needs_review'];

/**
 * Name: getNextModerationStatus.
 * Returns: The status the recipe moves to, or null when the action is not allowed from the current status.
 * Parameters: action, the moderator's action; currentStatus, the recipe's status now.
 * Description: Enforces the community recipe lifecycle so moderators cannot, for example, publish a private draft.
 */
export const getNextModerationStatus = (action: ModerationAction, currentStatus: CommunityRecipeStatus): CommunityRecipeStatus | null => {
  const transition = allowedTransitions[action];

  return transition.from.includes(currentStatus) ? transition.to : null;
};

/**
 * Name: canSubmitForReview.
 * Returns: True when the owner may send the recipe to moderators.
 * Parameters: status, the recipe's current status.
 * Description: Allows submitting private drafts and resubmitting rejected or unpublished recipes.
 */
export const canSubmitForReview = (status: CommunityRecipeStatus): boolean => submittableStatuses.includes(status);

/**
 * Name: shouldFlagForReview.
 * Returns: True when community feedback should send a published recipe back to moderators.
 * Parameters: openReportCount, helpfulCount, and notHelpfulCount for the recipe.
 * Description: Applies the feedback thresholds. Flagging hides the recipe for review but never deletes it.
 */
export const shouldFlagForReview = (openReportCount: number, helpfulCount: number, notHelpfulCount: number): boolean => {
  return openReportCount >= openReportFlagThreshold || (notHelpfulCount >= notHelpfulFlagMinimum && notHelpfulCount > helpfulCount);
};
