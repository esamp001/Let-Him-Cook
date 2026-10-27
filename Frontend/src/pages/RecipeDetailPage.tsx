import { useState, type CSSProperties } from 'react';
import { Button, Checkbox } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, FireOutlined, HeartOutlined, HeartFilled, PlusOutlined} from '@ant-design/icons';
import { toast } from '../components/Toast';
import type { ShoppingItem } from '../types/interfaces/ShoppingItem';
import type { RecipeDetailPageProps } from '../types/interfaces/RecipeDetailPageProps';
import { culinaryPalette } from '../theme/themeConfig';

const styles: Record<string, CSSProperties> = {
  container: { maxWidth: 900, margin: '0 auto', padding: '24px 24px 60px' }, backBar: { marginBottom: 16 }, backButton: { background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: culinaryPalette.primary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 0' }, hero: { width: '100%', height: 380, borderRadius: 20, overflow: 'hidden', marginBottom: 24, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)' }, image: { width: '100%', height: '100%', objectFit: 'cover' }, header: { marginBottom: 32 }, titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, title: { fontSize: 32, fontWeight: 800, color: culinaryPalette.text, margin: 0 }, favoriteButton: { background: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}`, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer' }, meta: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }, metaBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: culinaryPalette.textSecondary, backgroundColor: culinaryPalette.surfaceMuted, padding: '6px 14px', borderRadius: 9999 }, description: { fontSize: 16, lineHeight: 1.6, color: culinaryPalette.textSecondary, margin: 0 }, grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }, card: { backgroundColor: culinaryPalette.surface, borderRadius: 16, border: `1px solid ${culinaryPalette.border}`, padding: 24, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)' }, titleRowColumn: { display: 'flex', flexDirection: 'column', marginBottom: 16 }, columnTitle: { fontSize: 20, fontWeight: 700, color: culinaryPalette.text, margin: '0 0 4px' }, columnSubtitle: { fontSize: 12, color: culinaryPalette.textMuted }, ingredients: { display: 'flex', flexDirection: 'column', gap: 10 }, ingredientRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${culinaryPalette.borderSubtle}`, backgroundColor: culinaryPalette.pageBackground, cursor: 'pointer' }, ownedIngredientRow: { backgroundColor: culinaryPalette.successSurface, borderColor: culinaryPalette.successBackground }, ingredientInfo: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, ingredientName: { fontSize: 14, fontWeight: 500, color: culinaryPalette.textSecondary }, optionalTag: { color: culinaryPalette.textSubtle, fontSize: 12, fontWeight: 400 }, ingredientQuantity: { fontSize: 13, color: culinaryPalette.textMuted }, pantryBadge: { fontSize: 11, fontWeight: 600, color: culinaryPalette.success, backgroundColor: culinaryPalette.successBackground, padding: '2px 8px', borderRadius: 9999 }, steps: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }, step: { display: 'flex', alignItems: 'flex-start', gap: 12 }, stepNumber: { fontWeight: 700, color: culinaryPalette.primary, fontSize: 15, minWidth: 20 }, stepText: { fontSize: 14, lineHeight: 1.5, color: culinaryPalette.textSecondary }, ctaBar: { textAlign: 'center' }, ctaButton: { width: '100%', maxWidth: 420, height: 52, fontSize: 16, fontWeight: 700 },
};

const RecipeDetailPage = ({
  recipe,
  onBack,
  onAddToShoppingList,
}: RecipeDetailPageProps) => {

  const missingIngredientsCount = recipe.ingredients.filter((ing) => !ing.isOwned).map((ing) => ing.name)

  const [favorite, setFavorite] = useState(recipe.isFavorite ?? false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>( missingIngredientsCount);


  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleToggleFavorite = () => {
    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    if (nextFavorite) {
      toast.success('Recipe added to your favorites!');
    }
  };

  const handleAddShoppingList = () => {
    const itemsToAdd: ShoppingItem[] = recipe.ingredients
      .filter((ing) => selectedIngredients.includes(ing.name))
      .map((ing) => ({
        id: crypto.randomUUID(),
        name: ing.name + (ing.isOptional ? ' (optional)' : ''),
        quantity: ing.quantity || '1',
        checked: false,
      }));

    if (itemsToAdd.length === 0) {
      toast.warning('No ingredients selected to add.');
      return;
    }

    onAddToShoppingList(itemsToAdd);
    toast.info(`Added ${itemsToAdd.length} items to your shopping list.`);
  };

  return (
    <div style={styles.container}>
      {/* Back button bar */}
      <div style={styles.backBar}>
        <button type="button" style={styles.backButton} onClick={onBack}>
          <ArrowLeftOutlined /> Back to Recipes
        </button>
      </div>

      {/* Hero Banner Image */}
      <div style={styles.hero}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={styles.image}
        />
      </div>

      {/* Header Info */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{recipe.title}</h1>
          <button
            type="button"
            style={styles.favoriteButton}
            onClick={handleToggleFavorite}
            aria-label="Toggle favorite"
          >
            {favorite ? (
              <HeartFilled style={{ color: culinaryPalette.accent }} />
            ) : (
              <HeartOutlined style={{ color: culinaryPalette.textSecondary }} />
            )}
          </button>
        </div>

        <div style={styles.meta}>
          <span style={styles.metaBadge}>
            <ClockCircleOutlined /> {recipe.cookingTimeMinutes ? `${recipe.cookingTimeMinutes} min` : 'Time not listed'}
          </span>
          <span style={styles.metaBadge}>
            <FireOutlined /> {recipe.difficulty ?? 'Difficulty not listed'}
          </span>
        </div>

        {recipe.description && (
          <p style={styles.description}>{recipe.description}</p>
        )}
      </div>

      {/* Two-Column Grid: Ingredients & Steps */}
      <div style={styles.grid}>
        {/* Left Column: Ingredients */}
        <div style={styles.card}>
          <div style={styles.titleRowColumn}>
            <h2 style={styles.columnTitle}>Ingredients</h2>
            <span style={styles.columnSubtitle}>Select to add to shopping list</span>
          </div>

          <div style={styles.ingredients}>
            {recipe.ingredients.map((ing) => {
              const isSelected = selectedIngredients.includes(ing.name);
              return (
                <div
                  key={ing.name}
                  style={{ ...styles.ingredientRow, ...(ing.isOwned ? styles.ownedIngredientRow : {}) }}
                  onClick={() => toggleIngredient(ing.name)}
                >
                  <Checkbox
                    checked={isSelected || ing.isOwned}
                    disabled={ing.isOwned}
                  />
                  <div style={styles.ingredientInfo}>
                    <span style={styles.ingredientName}>
                      {ing.name}
                      {ing.isOptional && (
                        <span style={styles.optionalTag}> (optional)</span>
                      )}
                    </span>
                    {ing.quantity && (
                      <span style={styles.ingredientQuantity}>({ing.quantity})</span>
                    )}
                  </div>
                  {ing.isOwned && <span style={styles.pantryBadge}>In Pantry</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cooking Steps */}
        <div style={styles.card}>
          <h2 style={styles.columnTitle}>Steps</h2>
          <ol style={styles.steps}>
            {recipe.steps.map((step, idx) => (
              <li key={idx} style={styles.step}>
                <span style={styles.stepNumber}>{idx + 1}.</span>
                <span style={styles.stepText}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div style={styles.ctaBar}>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          style={styles.ctaButton}
          onClick={handleAddShoppingList}
        >
          Add to Shopping List
        </Button>
      </div>
    </div>
  );
};

export default RecipeDetailPage;

