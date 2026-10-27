import type { CSSProperties } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Tabs } from 'antd';
import { RecipeCard } from '../components/RecipeCard';
import RecipeDetailPage from './RecipeDetailPage';
import type { RecipesPageProps } from '../types/interfaces/RecipesPageProps';
import { culinaryPalette } from '../theme/themeConfig';

const styles: Record<string, CSSProperties> = {
  wrapper: { padding: '32px 0 64px' },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  resultsHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 },
  resultsTitle: { fontSize: 22, fontWeight: 700, color: culinaryPalette.text, margin: 0 },
  highlightedQuery: { color: culinaryPalette.primary },
  resultsCount: { fontSize: 14, color: culinaryPalette.textMuted, fontWeight: 500 },
  emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: culinaryPalette.surface, borderRadius: 16, border: `1px solid ${culinaryPalette.border}` },
  emptyText: { fontSize: 16, color: culinaryPalette.textSecondary, marginBottom: 16 },
  communityHint: { maxWidth: 540, margin: '0 auto', color: culinaryPalette.textSecondary, lineHeight: 1.6 },
  resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 },
  aiNotice: { fontSize: 14, color: culinaryPalette.textMuted, margin: '0 0 16px' },
};

const RecipesPage = ({
  searchQuery,
  recipes,
  preferences,
  isLoading,
  error,
  selectedRecipe,
  onSelectRecipe,
  onAddToShoppingList,
  onContributeRecipe,
}: RecipesPageProps) => {
  // The API has already interpreted the complete natural-language request and selected these recipes.
  // Filtering by every word in the sentence here can hide valid suggestions (for example, Filipino recipe names).
  const displayedRecipes = recipes ?? [];

  // If a recipe is selected, show detail view
  if (selectedRecipe) {
    return (
      <div style={styles.wrapper}>
        <RecipeDetailPage
          recipe={selectedRecipe}
          onBack={() => onSelectRecipe(null)}
          onAddToShoppingList={onAddToShoppingList}
        />
      </div>
    );
  }

  const forYouContent = (
    <>
      <div style={styles.resultsHeader}>
        <h1 style={styles.resultsTitle}>
          Recipes for &ldquo;<span style={styles.highlightedQuery}>{searchQuery || 'all ingredients'}</span>&rdquo;
        </h1>
        <span style={styles.resultsCount}>
          {isLoading ? 'Generating recipes...' : `${displayedRecipes.length} ${displayedRecipes.length === 1 ? 'result' : 'results'}`}
        </span>
      </div>

      {recipes && preferences.length > 0 && (
        <p style={styles.aiNotice}>AI detected: {preferences.join(', ')}. Recipe suggestions are AI-generated.</p>
      )}

      {isLoading ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Creating recipes based on your ingredients and preferences...</p>
        </div>
      ) : error ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>{error}</p>
        </div>
      ) : displayedRecipes.length > 0 ? (
        <div style={styles.resultsGrid}>
          {displayedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={(selected) => onSelectRecipe(selected)}
            />
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No AI recipe suggestions are available yet. Search from the dashboard to get started.</p>
        </div>
      )}
    </>
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <Tabs
          defaultActiveKey="for-you"
          items={[
            { key: 'for-you', label: 'For you', children: forYouContent },
            {
              key: 'community',
              label: 'Community',
              children: (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>No community recipes are published yet.</p>
                  <p style={styles.communityHint}>Community recipes will appear here after contributors submit them and an administrator approves them for everyone to use.</p>
                  <Button type="primary" icon={<PlusOutlined />} onClick={onContributeRecipe} style={{ marginTop: 20 }}>
                    Contribute a recipe
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default RecipesPage;


