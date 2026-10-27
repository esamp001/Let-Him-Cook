import { useState, type CSSProperties } from 'react';
import { CheckOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Input, List, Select, Space, Tag, Typography } from 'antd';
import { toast } from '../components/Toast';
import type { RecipeCuisine } from '../types/recipe';
import type { Recipe } from '../types/interfaces/Recipe';
import type { RecipeDraft } from '../types/interfaces/RecipeDraft';
import type { RecipeDraftApiResponse } from '../types/interfaces/RecipeDraftApiResponse';
import type { MyRecipesPageProps } from '../types/interfaces/MyRecipesPageProps';
import { culinaryPalette } from '../theme/themeConfig';
import generatedRecipeImage from '../assets/Rustic Herb Chicken Bowl with Fresh Garnishes.png';

const styles: Record<string, CSSProperties> = {
  page: { padding: '32px 24px 80px', background: culinaryPalette.pageBackground, minHeight: 'calc(100vh - 72px)' },
  container: { maxWidth: 920, margin: '0 auto' },
  heading: { marginBottom: 6, color: culinaryPalette.text },
  intro: { margin: '0 0 24px', color: culinaryPalette.textSecondary, fontSize: 16 },
  card: { borderColor: culinaryPalette.border, borderRadius: 16, marginBottom: 24 },
  fieldLabel: { display: 'block', marginBottom: 8, color: culinaryPalette.text, fontWeight: 600 },
  rawText: { minHeight: 190, resize: 'vertical', borderRadius: 12 },
  characterCount: { display: 'block', marginTop: 4, color: culinaryPalette.textSecondary, fontSize: 11, textAlign: 'right' },
  importHint: { margin: '6px 0 0', color: culinaryPalette.textSecondary, fontSize: 12, lineHeight: 1.45 },
  actions: { display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' },
  reviewSection: { marginTop: 20 },
  ingredientRow: { display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(180px, 2fr)', gap: 10, marginBottom: 10 },
  stepRow: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  stepNumber: { width: 24, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: culinaryPalette.textSecondary, fontWeight: 600 },
  savedHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  savedItem: { cursor: 'pointer' },
};

const maxRecipeTextLength = 4_000;

const MyRecipesPage = ({ recipes, onSaveRecipe, onSelectRecipe }: MyRecipesPageProps) => {
  const [rawText, setRawText] = useState('');
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

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

  const saveRecipe = () => {
    if (!draft) return;

    const savedRecipe: Recipe = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      cuisine: draft.cuisine,
      imageUrl: generatedRecipeImage,
      cookingTimeMinutes: draft.cookingTimeMinutes,
      difficulty: draft.difficulty,
      ingredients: draft.ingredients.filter((ingredient) => ingredient.name.trim()).map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity.trim() || 'Not specified',
        isOptional: ingredient.optional,
      })),
      steps: draft.steps.map((step) => step.trim()).filter(Boolean),
    };

    if (!savedRecipe.title || savedRecipe.ingredients.length === 0 || savedRecipe.steps.length === 0) {
      toast.warning('Add a title, at least one ingredient, and one cooking step before saving.');
      return;
    }

    onSaveRecipe(savedRecipe);
    toast.success(`${savedRecipe.title} was saved to My recipes.`);
    setDraft(null);
    setRawText('');
  };

  return (
    <section style={styles.page}>
      <div style={styles.container}>
        <Typography.Title level={1} style={styles.heading}>My recipes</Typography.Title>
        <p style={styles.intro}>Paste a recipe, family cooking notes, or an ingredient list. Let Him Cook creates an editable draft before you save it. Community submission will be available after accounts and moderation are added.</p>

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
              <Button type="primary" icon={<SaveOutlined />} onClick={saveRecipe}>Save privately</Button>
              <Button disabled>Submit to community</Button>
              <Button onClick={() => setDraft(null)}>Discard draft</Button>
            </Space>
            <Typography.Paragraph type="secondary" style={{ margin: '12px 0 0' }}>Community submission will be enabled after sign-in and administrator review are available.</Typography.Paragraph>
          </Card>
        )}

        <Card style={styles.card}>
          <div style={styles.savedHeader}>
            <Typography.Title level={3} style={{ margin: 0 }}>Saved recipes</Typography.Title>
            <Tag icon={<CheckOutlined />}>{recipes.length}</Tag>
          </div>
          {recipes.length === 0 ? (
            <Typography.Text type="secondary">Your approved recipe drafts will appear here.</Typography.Text>
          ) : (
            <List
              dataSource={recipes}
              renderItem={(recipe) => (
                <List.Item style={styles.savedItem} onClick={() => onSelectRecipe(recipe)}>
                  <List.Item.Meta title={recipe.title} description={`${recipe.ingredients.length} ingredients · ${recipe.steps.length} steps`} />
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
