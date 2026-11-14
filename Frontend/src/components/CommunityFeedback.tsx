import { useEffect, useState, type CSSProperties } from 'react';
import { DislikeFilled, DislikeOutlined, FlagOutlined, LikeFilled, LikeOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Select, Space, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildLoginPath } from '../front-end-helpers/auth-redirect.helpers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { culinaryPalette } from '../theme/themeConfig';
import type { RecipeReaction, ReportReason } from '../types/community';
import type { ApiResponse } from '../types/interfaces/ApiResponse';
import type { CommunityFeedbackProps } from '../types/interfaces/CommunityFeedbackProps';
import type { RecipeFeedback } from '../types/interfaces/RecipeFeedback';

const reportReasonOptions = [
  { value: 'incorrect_recipe', label: 'Incorrect recipe' },
  { value: 'not_filipino', label: 'Not Filipino' },
  { value: 'unsafe', label: 'Unsafe' },
  { value: 'spam', label: 'Spam' },
  { value: 'copyright', label: 'Copyright concern' },
  { value: 'other', label: 'Other' },
] as const;

const styles: Record<string, CSSProperties> = {
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTop: `1px solid ${culinaryPalette.borderSubtle}`
  },
  label: {
    margin: 0,
    fontSize: 14,
    color: culinaryPalette.textSecondary
  },
  modalField: {
    width: '100%',
    marginTop: 8
  },
  modalLabel: {
    display: 'block',
    marginTop: 12,
    fontSize: 13,
    fontWeight: 600,
    color: culinaryPalette.text
  }
};

export const CommunityFeedback = ({ recipeId }: CommunityFeedbackProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const [feedback, setFeedback] = useState<RecipeFeedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('incorrect_recipe');
  const [reportDetails, setReportDetails] = useState('');
  const userId = currentUser?.id;

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const apiResponse = await fetch(`/api/v1/community/recipes/${recipeId}/feedback`);
        const response = await apiResponse.json() as ApiResponse<{ feedback: RecipeFeedback }>;

        // A recipe that is not published (or not yours) has no public feedback, so the bar stays hidden.
        setFeedback(apiResponse.ok && response.data ? response.data.feedback : null);
      } catch {
        setFeedback(null);
      }
    };

    void loadFeedback();
  }, [recipeId, userId]);

  if (!feedback) return null;

  // Returns true when the visitor can rate or report; otherwise explains what they need to do first.
  const canGiveFeedback = () => {
    if (!currentUser) {
      message.info('Sign in to rate or report community recipes.');
      navigate(buildLoginPath(`${location.pathname}${location.search}`));
      return false;
    }

    if (!currentUser.emailVerified) {
      message.warning('Confirm your email first. Use "Resend email" in the banner at the top of the page.');
      return false;
    }

    return true;
  };

  const handleReaction = async (reaction: RecipeReaction) => {
    if (!canGiveFeedback()) return;

    const isRemoving = feedback.myReaction === reaction;
    setIsSaving(true);

    try {
      const apiResponse = await fetch(`/api/v1/community/recipes/${recipeId}/reaction`, {
        method: isRemoving ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: isRemoving ? undefined : JSON.stringify({ reaction }),
      });

      const response = await apiResponse.json() as ApiResponse<{ helpfulCount: number; notHelpfulCount: number; myReaction: RecipeReaction | null; flagged?: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to save your rating.');
      }

      const { helpfulCount, notHelpfulCount, myReaction } = response.data;
      setFeedback({ ...feedback, helpfulCount, notHelpfulCount, myReaction });
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to save your rating.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReport = async () => {
    setIsSaving(true);

    try {
      const apiResponse = await fetch(`/api/v1/community/recipes/${recipeId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, details: reportDetails.trim() || undefined }),
      });

      const response = await apiResponse.json() as ApiResponse<{ reported: boolean; flagged: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to send your report.');
      }

      setFeedback({ ...feedback, hasOpenReport: true });
      setIsReportOpen(false);
      setReportDetails('');
      message.success('Thanks. A moderator will review this recipe.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to send your report.');
    } finally {
      setIsSaving(false);
    }
  };

  if (feedback.isOwner) {
    return (
      <div style={styles.bar}>
        <p style={styles.label}>This is your recipe. {feedback.helpfulCount} found it helpful, {feedback.notHelpfulCount} did not.</p>
      </div>
    );
  }

  return (
    <div style={styles.bar}>
      <p style={styles.label}>Was this recipe helpful?</p>
      <Space wrap>
        <Button
          icon={feedback.myReaction === 'helpful' ? <LikeFilled /> : <LikeOutlined />}
          type={feedback.myReaction === 'helpful' ? 'primary' : 'default'}
          disabled={isSaving}
          aria-pressed={feedback.myReaction === 'helpful'}
          onClick={() => void handleReaction('helpful')}
        >
          Helpful ({feedback.helpfulCount})
        </Button>
        <Button
          icon={feedback.myReaction === 'not_helpful' ? <DislikeFilled /> : <DislikeOutlined />}
          type={feedback.myReaction === 'not_helpful' ? 'primary' : 'default'}
          disabled={isSaving}
          aria-pressed={feedback.myReaction === 'not_helpful'}
          onClick={() => void handleReaction('not_helpful')}
        >
          Not helpful ({feedback.notHelpfulCount})
        </Button>
        <Button
          type="text"
          icon={<FlagOutlined />}
          disabled={feedback.hasOpenReport}
          onClick={() => canGiveFeedback() && setIsReportOpen(true)}
        >
          {feedback.hasOpenReport ? 'Reported' : 'Report'}
        </Button>
      </Space>

      <Modal
        title="Report this recipe"
        open={isReportOpen}
        okText="Send report"
        confirmLoading={isSaving}
        onOk={handleReport}
        onCancel={() => setIsReportOpen(false)}
      >
        <label
          htmlFor="report-reason"
          style={styles.modalLabel}
        >
          Reason
        </label>
        <Select
          id="report-reason"
          value={reportReason}
          options={[...reportReasonOptions]}
          onChange={(reason: ReportReason) => setReportReason(reason)}
          style={styles.modalField}
        />
        <label
          htmlFor="report-details"
          style={styles.modalLabel}
        >
          Details (optional)
        </label>
        <Input.TextArea
          id="report-details"
          value={reportDetails}
          maxLength={1000}
          autoSize={{ minRows: 3, maxRows: 6 }}
          onChange={(event) => setReportDetails(event.target.value)}
          style={styles.modalField}
        />
      </Modal>
    </div>
  );
};
