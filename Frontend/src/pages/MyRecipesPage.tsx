import { useEffect, useState, type CSSProperties } from 'react';
import { CheckOutlined, DeleteOutlined, EditOutlined, HeartFilled, PlusOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Input, List, Popconfirm, Select, Space, Tag, Tooltip, Typography } from 'antd';
import { SignInPrompt } from '../components/SignInPrompt';
import { toast } from '../components/Toast';
import { toBrowseUiRecipe } from '../front-end-helpers/recipe-browse.helpers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useFavorites } from '../hooks/useFavorites';
import type { CommunityRecipeStatus } from '../types/community';
import type { RecipeCuisine } from '../types/recipe';
import type { ApiResponse } from '../types/interfaces/ApiResponse';
import type { CommunityRecipe } from '../types/interfaces/CommunityRecipe';
import type { Recipe } from '../types/interfaces/Recipe';
import type { RecipeDraft } from '../types/interfaces/RecipeDraft';
import type { RecipeDraftApiResponse } from '../types/interfaces/RecipeDraftApiResponse';
import type { MyRecipesPageProps } from '../types/interfaces/MyRecipesPageProps';
import { culinaryPalette } from '../theme/themeConfig';
import generatedRecipeImage from '../assets/Rustic Herb Chicken Bowl with Fresh Garnishes.png';

const styles: Record<string, CSSProperties> = {
  page: {
    padding: '32px 24px 80px',
    background: culinaryPalette.pageBackground,
    minHeight: 'calc(100vh - 72px)'
  },
  container: {
    maxWidth: 920,
    margin: '0 auto'
  },
  heading: {
    marginBottom: 6,
    color: culinaryPalette.text
  },
  intro: {
    margin: '0 0 24px',
    color: culinaryPalette.textSecondary,
    fontSize: 16
  },
  card: {
    borderColor: culinaryPalette.border,
    borderRadius: 16,
    marginBottom: 24
  },
  fieldLabel: {
    display: 'block',
    marginBottom: 8,
    color: culinaryPalette.text,
    fontWeight: 600
  },
  rawText: {
    minHeight: 190,
    resize: 'vertical',
    borderRadius: 12
  },
  characterCount: {
    display: 'block',
    marginTop: 4,
    color: culinaryPalette.textSecondary,
    fontSize: 11,
    textAlign: 'right'
  },
  importHint: {
    margin: '6px 0 0',
    color: culinaryPalette.textSecondary,
    fontSize: 12,
    lineHeight: 1.45
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap'
  },
  reviewSection: {
    marginTop: 20
  },
  ingredientRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1fr) minmax(180px, 2fr)',
    gap: 10,
    marginBottom: 10
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10
  },
  stepNumber: {
    width: 24,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: culinaryPalette.textSecondary,
    fontWeight: 600
  },
  savedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12
  },
  savedItem: {
    cursor: 'pointer'
  },
  statusNote: {
    margin: '4px 0 0',
    fontSize: 13,
    color: culinaryPalette.textMuted
  }
};

const maxRecipeTextLength = 4_000;

const recipeStatusDetails: Record<CommunityRecipeStatus, { label: string; color: string; note: string }> = {
  private: { label: 'Private', color: 'default', note: 'Only you can see this recipe.' },
  pending_review: { label: 'Waiting for review', color: 'blue', note: 'A moderator will review it before it is published.' },
  published: { label: 'Published', color: 'green', note: 'Everyone can find it in the Community recipes.' },
  needs_review: { label: 'Under review', color: 'orange', note: 'Hidden while a moderator checks community feedback.' },
  unpublished: { label: 'Unpublished', color: 'default', note: 'A moderator took it down. You can submit it again.' },
  rejected: { label: 'Not approved', color: 'red', note: 'You can edit your notes and submit it again.' },
};

const submittableStatuses: readonly CommunityRecipeStatus[] = ['private', 'rejected', 'unpublished'];

const MyRecipesPage = ({ onSelectRecipe }: MyRecipesPageProps) => {
  const { currentUser, isLoadingUser } = useCurrentUser();
  const { favorites, toggleFavorite } = useFavorites();
  const [rawText, setRawText] = useState('');
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [myRecipes, setMyRecipes] = useState<CommunityRecipe[]>([]);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [busyRecipeId, setBusyRecipeId] = useState<string | null>(null);
  const userId = currentUser?.id;
  const myUiRecipes: Recipe[] = myRecipes.map((recipe) => ({ ...toBrowseUiRecipe(recipe), imageUrl: recipe.imageUrl ?? generatedRecipeImage }));
  const savedRecipes = favorites.map((favorite) => favorite.recipe);

  useEffect(() => {
    if (!userId) {
      setMyRecipes([]);
      return;
    }

    const loadMyRecipes = async () => {
      try {
        const apiResponse = await fetch('/api/v1/community/my-recipes');
        const response = await apiResponse.json() as ApiResponse<{ recipes: CommunityRecipe[] }>;

        if (!apiResponse.ok || !response.data) {
          throw new Error(response.error?.message ?? 'Unable to load your recipes.');
        }

        setMyRecipes(response.data.recipes);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load your recipes.');
      }
    };

    void loadMyRecipes();
  }, [userId]);

  const createDraft = async () => {
    if (rawText.trim().length < 20) {
      toast.warning('Paste at least a short recipe description, ingredients, or cooking notes first.');
      return;
    }

    if (rawText.length > maxRecipeTextLength) {
      toast.warning(`Recipe text is too long. Keep it to ${maxRecipeTextLength.toLocaleString()} characters or fewer, using only the title, ingredients, and steps.`);
      return;
    }

    setIsCreatingDraft(true);
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), 190_000);

    try {
      const apiResponse = await fetch('/api/v1/ai/recipe-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
        signal: abortController.signal,
      });
      const response = await apiResponse.json() as RecipeDraftApiResponse;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to create a recipe draft.');
      }

      setDraft(response.data.draft);
      if (response.data.importWarning) {
        toast.warning(response.data.importWarning, { duration: 6000 });
      }
    } catch (requestError) {
      toast.error(requestError instanceof DOMException && requestError.name === 'AbortError'
        ? 'Creating this recipe draft is taking longer than expected. Try a shorter recipe with only the title, ingredients, and steps.'
        : requestError instanceof Error ? requestError.message : 'Unable to create a recipe draft.');
    } finally {
      window.clearTimeout(timeoutId);
      setIsCreatingDraft(false);
    }
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    setDraft((previous) => {
      if (!previous) return previous;
      const ingredients = previous.ingredients.map((ingredient, ingredientIndex) => (
        ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
      ));
      return { ...previous, ingredients };
    });
  };

  const updateStep = (index: number, value: string) => {
    setDraft((previous) => {
      if (!previous) return previous;
      const steps = previous.steps.map((step, stepIndex) => stepIndex === index ? value : step);
      return { ...previous, steps };
    });
  };

  const saveRecipe = async () => {
    if (!draft) return;

    const newRecipe = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      cuisine: draft.cuisine === 'any' ? null : draft.cuisine,
      cookingTimeMinutes: draft.cookingTimeMinutes,
      difficulty: draft.difficulty,
      ingredients: draft.ingredients.filter((ingredient) => ingredient.name.trim()).map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity.trim(),
        isOptional: ingredient.optional,
      })),
      steps: draft.steps.map((step) => step.trim()).filter(Boolean),
    };

    if (!newRecipe.title || newRecipe.ingredients.length === 0 || newRecipe.steps.length === 0) {
      toast.warning('Add a title, at least one ingredient, and one cooking step before saving.');
      return;
    }

    setIsSavingRecipe(true);

    try {
      const apiResponse = await fetch('/api/v1/community/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipe),
      });

      const response = await apiResponse.json() as ApiResponse<{ recipe: CommunityRecipe }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to save this recipe.');
      }

      const { recipe } = response.data;
      setMyRecipes((previousRecipes) => [recipe, ...previousRecipes]);
      toast.success(`${recipe.title} was saved privately to My recipes.`);
      setDraft(null);
      setRawText('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save this recipe.');
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const submitForReview = async (recipe: CommunityRecipe) => {
    setBusyRecipeId(recipe.recipeId);

    try {
      const apiResponse = await fetch(`/api/v1/community/recipes/${recipe.recipeId}/submit`, { method: 'POST' });
      const response = await apiResponse.json() as ApiResponse<{ status: CommunityRecipeStatus }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to submit this recipe.');
      }

      const { status } = response.data;
      setMyRecipes((previousRecipes) => previousRecipes.map((myRecipe) => myRecipe.recipeId === recipe.recipeId ? { ...myRecipe, status } : myRecipe));
      toast.success(`${recipe.title} was sent to the moderators.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit this recipe.');
    } finally {
      setBusyRecipeId(null);
    }
  };

  const deleteMyRecipe = async (recipe: CommunityRecipe) => {
    setBusyRecipeId(recipe.recipeId);

    try {
      const apiResponse = await fetch(`/api/v1/community/recipes/${recipe.recipeId}`, { method: 'DELETE' });
      const response = await apiResponse.json() as ApiResponse<{ deleted: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to delete this recipe.');
      }

      setMyRecipes((previousRecipes) => previousRecipes.filter((myRecipe) => myRecipe.recipeId !== recipe.recipeId));
      toast.success(`${recipe.title} was deleted.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete this recipe.');
    } finally {
      setBusyRecipeId(null);
    }
  };

  if (!isLoadingUser && !currentUser) {
    return (
      <SignInPrompt
        title="Sign in to see your recipes"
        description="Save your own recipes privately, submit them to the community, and keep the recipes you love."
      />
    );
  }

  return (
    <section style={styles.page}>
      <div style={styles.container}>
        <Typography.Title level={1} style={styles.heading}>My recipes</Typography.Title>
        <p style={styles.intro}>Paste a recipe, family cooking notes, or an ingredient list. Let Him Cook creates an editable draft before you save it. Saved recipes stay private until you submit them to the community for review.</p>

        <Card style={styles.card}>
          <label htmlFor="recipe-text" style={styles.fieldLabel}>Recipe text</label>
          <Input.TextArea
            id="recipe-text"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder={'Example: Chicken adobo — 1 kg chicken, soy sauce, vinegar, garlic, and bay leaves. Marinate the chicken, then simmer with the sauce for 30 minutes.'}
            style={styles.rawText}
          />
          <span style={{ ...styles.characterCount, color: rawText.length > maxRecipeTextLength ? '#B91C1C' : culinaryPalette.textSecondary }}>
            {rawText.length.toLocaleString()} / {maxRecipeTextLength.toLocaleString()}
          </span>
          <p style={styles.importHint}>For best results, paste only the recipe title, ingredients, and cooking steps. Long articles or stories should be shortened first.</p>
          <div style={styles.actions}>
            <Button type="primary" icon={<PlusOutlined />} loading={isCreatingDraft} onClick={createDraft}>
              Create recipe draft
            </Button>
          </div>
        </Card>

        {draft && (
          <Card title="Review your recipe" extra={<Tag icon={<EditOutlined />}>Editable draft</Tag>} style={styles.card}>
            <label htmlFor="recipe-title" style={styles.fieldLabel}>Title</label>
            <Input id="recipe-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />

            <div style={styles.reviewSection}>
              <label htmlFor="recipe-description" style={styles.fieldLabel}>Description</label>
              <Input.TextArea id="recipe-description" value={draft.description} autoSize={{ minRows: 2, maxRows: 4 }} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>

            <div style={styles.reviewSection}>
              <label htmlFor="recipe-cuisine" style={styles.fieldLabel}>Cuisine</label>
              <Select
                id="recipe-cuisine"
                value={draft.cuisine}
                onChange={(cuisine: RecipeCuisine) => setDraft({ ...draft, cuisine })}
                options={[
                  { value: 'any', label: 'Any' },
                  { value: 'filipino', label: 'Filipino' },
                  { value: 'asian', label: 'Asian' },
                  { value: 'italian', label: 'Italian' },
                  { value: 'western', label: 'Western' },
                  { value: 'other', label: 'Other' },
                ]}
                style={{ width: '100%' }}
              />
            </div>

            <Divider />
            <Typography.Title level={4}>Ingredients</Typography.Title>
            {draft.ingredients.map((ingredient, index) => (
              <div key={`${ingredient.name}-${index}`} style={styles.ingredientRow}>
                <Input aria-label={`Quantity for ingredient ${index + 1}`} value={ingredient.quantity} onChange={(event) => updateIngredient(index, 'quantity', event.target.value)} />
                <Input aria-label={`Ingredient ${index + 1}`} value={ingredient.name} onChange={(event) => updateIngredient(index, 'name', event.target.value)} />
              </div>
            ))}

            <Divider />
            <Typography.Title level={4}>Steps</Typography.Title>
            {draft.steps.map((step, index) => (
              <div key={index} style={styles.stepRow}>
                <span style={styles.stepNumber}>{index + 1}</span>
                <Input.TextArea aria-label={`Step ${index + 1}`} value={step} autoSize={{ minRows: 1, maxRows: 4 }} onChange={(event) => updateStep(index, event.target.value)} />
              </div>
            ))}

            <Divider />
            <Space wrap>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={isSavingRecipe}
                onClick={saveRecipe}
              >
                Save privately
              </Button>
              <Button onClick={() => setDraft(null)}>Discard draft</Button>
            </Space>
            <Typography.Paragraph type="secondary" style={{ margin: '12px 0 0' }}>Your recipe stays private until you submit it. A moderator reviews it before it appears in the Community recipes.</Typography.Paragraph>
          </Card>
        )}

        <Card style={styles.card}>
          <div style={styles.savedHeader}>
            <Typography.Title level={3} style={{ margin: 0 }}>My recipes</Typography.Title>
            <Tag icon={<CheckOutlined />}>{myRecipes.length}</Tag>
          </div>
          {myRecipes.length === 0 ? (
            <Typography.Text type="secondary">Recipes you save privately will appear here.</Typography.Text>
          ) : (
            <List
              dataSource={myRecipes}
              renderItem={(recipe, index) => (
                <List.Item
                  actions={[
                    submittableStatuses.includes(recipe.status) && (
                      <Tooltip
                        key="submit"
                        title={currentUser?.emailVerified ? '' : 'Confirm your email first to submit recipes.'}
                      >
                        <Button
                          size="small"
                          icon={<SendOutlined />}
                          disabled={!currentUser?.emailVerified}
                          loading={busyRecipeId === recipe.recipeId}
                          onClick={() => void submitForReview(recipe)}
                        >
                          Submit for review
                        </Button>
                      </Tooltip>
                    ),
                    <Popconfirm
                      key="delete"
                      title="Delete this recipe?"
                      description="This cannot be undone."
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => deleteMyRecipe(recipe)}
                    >
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        aria-label={`Delete ${recipe.title}`}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={(
                      <Space wrap>
                        <Typography.Link onClick={() => onSelectRecipe(myUiRecipes[index], myUiRecipes)}>{recipe.title}</Typography.Link>
                        <Tag color={recipeStatusDetails[recipe.status].color}>{recipeStatusDetails[recipe.status].label}</Tag>
                      </Space>
                    )}
                    description={(
                      <>
                        {`${recipe.ingredients.length} ingredients · ${recipe.steps.length} steps`}
                        <p style={styles.statusNote}>{recipeStatusDetails[recipe.status].note}</p>
                      </>
                    )}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card style={styles.card}>
          <div style={styles.savedHeader}>
            <Typography.Title level={3} style={{ margin: 0 }}>Saved recipes</Typography.Title>
            <Tag icon={<HeartFilled />}>{favorites.length}</Tag>
          </div>
          {favorites.length === 0 ? (
            <Typography.Text type="secondary">Tap the heart on any recipe to save it here.</Typography.Text>
          ) : (
            <List
              dataSource={favorites}
              renderItem={(favorite) => (
                <List.Item
                  actions={[
                    <Button
                      key="unsave"
                      size="small"
                      type="text"
                      onClick={() => void toggleFavorite(favorite.recipe)}
                    >
                      Remove
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<Typography.Link onClick={() => onSelectRecipe(favorite.recipe, savedRecipes)}>{favorite.recipe.title}</Typography.Link>}
                    description={`${favorite.recipe.ingredients.length} ingredients · ${favorite.recipe.steps.length} steps`}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </section>
  );
};

export default MyRecipesPage;
