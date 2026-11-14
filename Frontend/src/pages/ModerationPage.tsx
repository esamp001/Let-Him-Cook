import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Button, Card, Collapse, Empty, Input, List, Result, Select, Space, Spin, Tabs, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SignInPrompt } from '../components/SignInPrompt';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { culinaryPalette } from '../theme/themeConfig';
import type { CommunityRecipeStatus, ModerationAction, ReportReason, ReportStatus } from '../types/community';
import type { ApiResponse } from '../types/interfaces/ApiResponse';
import type { ModerationRecipe } from '../types/interfaces/ModerationRecipe';
import type { RecipeReportItem } from '../types/interfaces/RecipeReportItem';

type RecipeFilter = 'queue' | CommunityRecipeStatus;

const recipeFilterOptions = [
  { value: 'queue', label: 'Needs a decision' },
  { value: 'pending_review', label: 'Waiting for review' },
  { value: 'needs_review', label: 'Flagged by the community' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
  { value: 'rejected', label: 'Not approved' },
] as const;

const reportFilterOptions = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
] as const;

const statusTags: Record<CommunityRecipeStatus, { label: string; color: string }> = {
  private: { label: 'Private', color: 'default' },
  pending_review: { label: 'Waiting for review', color: 'blue' },
  published: { label: 'Published', color: 'green' },
  needs_review: { label: 'Flagged', color: 'orange' },
  unpublished: { label: 'Unpublished', color: 'default' },
  rejected: { label: 'Not approved', color: 'red' },
};

// Mirrors the backend lifecycle so only valid actions are offered.
const actionsByStatus: Record<CommunityRecipeStatus, readonly ModerationAction[]> = {
  private: [],
  pending_review: ['approve', 'reject'],
  published: ['unpublish'],
  needs_review: ['restore', 'unpublish', 'reject'],
  unpublished: ['restore'],
  rejected: [],
};

const actionLabels: Record<ModerationAction, string> = {
  approve: 'Approve and publish',
  reject: 'Reject',
  unpublish: 'Unpublish',
  restore: 'Restore and publish',
};

const reportReasonLabels: Record<ReportReason, string> = {
  incorrect_recipe: 'Incorrect recipe',
  not_filipino: 'Not Filipino',
  unsafe: 'Unsafe',
  spam: 'Spam',
  copyright: 'Copyright concern',
  other: 'Other',
};

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '32px 16px 80px'
  },
  heading: {
    margin: '0 0 4px',
    fontSize: 30,
    fontWeight: 800,
    color: culinaryPalette.text
  },
  intro: {
    margin: '0 0 24px',
    color: culinaryPalette.textSecondary
  },
  filter: {
    minWidth: 240,
    marginBottom: 16
  },
  card: {
    marginBottom: 16,
    borderRadius: 16
  },
  meta: {
    margin: '4px 0 12px',
    fontSize: 13,
    color: culinaryPalette.textMuted
  },
  noteInput: {
    margin: '12px 0'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: 48
  }
};

const ModerationPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoadingUser } = useCurrentUser();
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>('queue');
  const [reportFilter, setReportFilter] = useState<ReportStatus>('open');
  const [recipes, setRecipes] = useState<ModerationRecipe[]>([]);
  const [reports, setReports] = useState<RecipeReportItem[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const isAdmin = currentUser?.role === 'admin';

  const loadRecipes = useCallback(async () => {
    setIsLoadingRecipes(true);

    try {
      const query = recipeFilter === 'queue' ? '' : `?status=${recipeFilter}`;
      const apiResponse = await fetch(`/api/v1/moderation/recipes${query}`);
      const response = await apiResponse.json() as ApiResponse<{ recipes: ModerationRecipe[] }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to load recipes for review.');
      }

      setRecipes(response.data.recipes);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to load recipes for review.');
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [recipeFilter]);

  const loadReports = useCallback(async () => {
    setIsLoadingReports(true);

    try {
      const apiResponse = await fetch(`/api/v1/moderation/reports?status=${reportFilter}`);
      const response = await apiResponse.json() as ApiResponse<{ reports: RecipeReportItem[] }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to load reports.');
      }

      setReports(response.data.reports);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to load reports.');
    } finally {
      setIsLoadingReports(false);
    }
  }, [reportFilter]);

  useEffect(() => {
    if (isAdmin) void loadRecipes();
  }, [isAdmin, loadRecipes]);

  useEffect(() => {
    if (isAdmin) void loadReports();
  }, [isAdmin, loadReports]);

  const handleModerate = async (recipe: ModerationRecipe, action: ModerationAction) => {
    setBusyId(recipe.recipeId);

    try {
      const apiResponse = await fetch(`/api/v1/moderation/recipes/${recipe.recipeId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: notes[recipe.recipeId]?.trim() || undefined }),
      });

      const response = await apiResponse.json() as ApiResponse<{ status: CommunityRecipeStatus }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to update this recipe.');
      }

      message.success(`${recipe.title} is now ${statusTags[response.data.status].label.toLowerCase()}.`);
      await loadRecipes();
      await loadReports();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update this recipe.');
    } finally {
      setBusyId(null);
    }
  };

  const handleResolveReport = async (report: RecipeReportItem, status: Exclude<ReportStatus, 'open'>) => {
    setBusyId(report.id);

    try {
      const apiResponse = await fetch(`/api/v1/moderation/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const response = await apiResponse.json() as ApiResponse<{ status: ReportStatus }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to update this report.');
      }

      setReports((previousReports) => previousReports.filter((previousReport) => previousReport.id !== report.id));
      message.success(status === 'resolved' ? 'Report marked as resolved.' : 'Report dismissed.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update this report.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoadingUser) {
    return (
      <div style={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <SignInPrompt
        title="Sign in to moderate recipes"
        description="The moderation area is only available to administrators."
      />
    );
  }

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="You don't have access"
        subTitle="Only administrators can review community recipes."
        extra={(
          <Button
            type="primary"
            onClick={() => navigate('/Home')}
          >
            Go to home
          </Button>
        )}
      />
    );
  }

  const recipesTab = (
    <>
      <Select
        value={recipeFilter}
        options={[...recipeFilterOptions]}
        onChange={(value: RecipeFilter) => setRecipeFilter(value)}
        aria-label="Filter recipes by status"
        style={styles.filter}
      />
      {isLoadingRecipes ? (
        <div style={styles.loading}>
          <Spin />
        </div>
      ) : recipes.length === 0 ? (
        <Empty description="Nothing to review here." />
      ) : recipes.map((recipe) => (
        <Card
          key={recipe.recipeId}
          style={styles.card}
        >
          <Space wrap>
            <Typography.Title
              level={4}
              style={{ margin: 0 }}
            >
              {recipe.title}
            </Typography.Title>
            <Tag color={statusTags[recipe.status].color}>{statusTags[recipe.status].label}</Tag>
            {recipe.openReportCount > 0 && <Tag color="red">{recipe.openReportCount} open report(s)</Tag>}
          </Space>
          <p style={styles.meta}>
            By {recipe.authorName ?? 'a deleted account'} · {recipe.cuisine ?? 'No cuisine'} · {recipe.helpfulCount} helpful, {recipe.notHelpfulCount} not helpful
          </p>
          {recipe.description && <Typography.Paragraph>{recipe.description}</Typography.Paragraph>}
          <Collapse
            size="small"
            items={[{
              key: 'details',
              label: `${recipe.ingredients.length} ingredients · ${recipe.steps.length} steps`,
              children: (
                <>
                  <Typography.Text strong>Ingredients</Typography.Text>
                  <ul>
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={`${ingredient.name}-${index}`}>{ingredient.quantity} {ingredient.name}{ingredient.isOptional ? ' (optional)' : ''}</li>
                    ))}
                  </ul>
                  <Typography.Text strong>Steps</Typography.Text>
                  <ol>
                    {recipe.steps.map((step, index) => <li key={index}>{step}</li>)}
                  </ol>
                </>
              ),
            }]}
          />
          {actionsByStatus[recipe.status].length > 0 && (
            <>
              <Input
                placeholder="Note for the record (optional)"
                value={notes[recipe.recipeId] ?? ''}
                maxLength={1000}
                onChange={(event) => setNotes((previousNotes) => ({ ...previousNotes, [recipe.recipeId]: event.target.value }))}
                style={styles.noteInput}
              />
              <Space wrap>
                {actionsByStatus[recipe.status].map((action) => (
                  <Button
                    key={action}
                    type={action === 'approve' || action === 'restore' ? 'primary' : 'default'}
                    danger={action === 'reject' || action === 'unpublish'}
                    loading={busyId === recipe.recipeId}
                    onClick={() => void handleModerate(recipe, action)}
                  >
                    {actionLabels[action]}
                  </Button>
                ))}
              </Space>
            </>
          )}
        </Card>
      ))}
    </>
  );

  const reportsTab = (
    <>
      <Select
        value={reportFilter}
        options={[...reportFilterOptions]}
        onChange={(value: ReportStatus) => setReportFilter(value)}
        aria-label="Filter reports by status"
        style={styles.filter}
      />
      {isLoadingReports ? (
        <div style={styles.loading}>
          <Spin />
        </div>
      ) : (
        <List
          dataSource={reports}
          locale={{ emptyText: 'No reports here.' }}
          renderItem={(report) => (
            <List.Item
              actions={report.status === 'open' ? [
                <Button
                  key="resolve"
                  size="small"
                  loading={busyId === report.id}
                  onClick={() => void handleResolveReport(report, 'resolved')}
                >
                  Resolve
                </Button>,
                <Button
                  key="dismiss"
                  size="small"
                  type="text"
                  loading={busyId === report.id}
                  onClick={() => void handleResolveReport(report, 'dismissed')}
                >
                  Dismiss
                </Button>,
              ] : []}
            >
              <List.Item.Meta
                title={(
                  <Space wrap>
                    <span>{report.recipeTitle}</span>
                    <Tag color={statusTags[report.recipeStatus].color}>{statusTags[report.recipeStatus].label}</Tag>
                    <Tag>{reportReasonLabels[report.reason]}</Tag>
                  </Space>
                )}
                description={`${report.details ?? 'No details given.'} — reported by ${report.reporterName ?? 'a deleted account'} on ${new Date(report.createdAt).toLocaleDateString()}`}
              />
            </List.Item>
          )}
        />
      )}
    </>
  );

  return (
    <section style={styles.page}>
      <h1 style={styles.heading}>Moderation</h1>
      <p style={styles.intro}>Review submitted recipes and community reports. Flagged recipes stay hidden until you decide; nothing is deleted automatically.</p>
      <Tabs
        items={[
          { key: 'recipes', label: 'Recipes', children: recipesTab },
          { key: 'reports', label: 'Reports', children: reportsTab },
        ]}
      />
    </section>
  );
};

export default ModerationPage;
