import { useEffect, useState, type CSSProperties } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Input, Pagination, Select, Skeleton, Tabs } from 'antd';
import { RecipeCard } from '../components/RecipeCard';
import RecipeDetailPage from './RecipeDetailPage';
import { toBrowseUiRecipe } from '../front-end-helpers/recipe-browse.helpers';
import type { BrowseRecipesResponse } from '../types/interfaces/BrowseRecipesResponse';
import type { Recipe } from '../types/interfaces/Recipe';
import type { RecipesPageProps } from '../types/interfaces/RecipesPageProps';
import { culinaryPalette } from '../theme/themeConfig';

const browsePageSize = 12;
const sourceOptions = [
  { value: 'all', label: 'All sources' },
  { value: 'themealdb', label: 'TheMealDB' },
  { value: 'community', label: 'Community' },
] as const;

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
  resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 },
  aiNotice: { fontSize: 14, color: culinaryPalette.textMuted, margin: '0 0 16px' },
  browseHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  browseFilters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginBottom: 20 },
  browseSearch: { width: '100%' },
  browseSelect: { width: '100%' },
  browsePagination: { marginTop: 24, textAlign: 'center' },
  browseSkeletonCard: { padding: 16, backgroundColor: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}`, borderRadius: 8 },
  browseSkeletonImageRoot: { display: 'block', width: '100%' },
  browseSkeletonImage: { width: '100%', height: 180, marginBottom: 16 },
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
  const [activeTab, setActiveTab] = useState('for-you');
  const [browsePage, setBrowsePage] = useState(1);
  const [browseSearchInput, setBrowseSearchInput] = useState('');
  const [browseSearch, setBrowseSearch] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [browseIngredient, setBrowseIngredient] = useState('');
  const [browseCuisine, setBrowseCuisine] = useState('any');
  const [browseSource, setBrowseSource] = useState('all');
  const [browseCuisines, setBrowseCuisines] = useState<string[]>([]);
  const [browseRecipes, setBrowseRecipes] = useState<Recipe[]>([]);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browseRetryKey, setBrowseRetryKey] = useState(0);
  const [isBrowseLoading, setIsBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'explore') return;

    const abortController = new AbortController();
    const loadBrowseRecipes = async () => {
      setIsBrowseLoading(true);
      setBrowseError(null);

      try {
        const query = new URLSearchParams({
          page: String(browsePage),
          pageSize: String(browsePageSize),
          search: browseSearch,
          ingredient: browseIngredient,
          cuisine: browseCuisine,
          source: browseSource,
        });
        const apiResponse = await fetch(`/api/v1/recipes?${query}`, { signal: abortController.signal });
        const response = await apiResponse.json() as BrowseRecipesResponse;

        if (!apiResponse.ok || !response.data) {
          throw new Error(response.error?.message ?? 'Unable to load recipes.');
        }

        setBrowseRecipes(response.data.recipes.map(toBrowseUiRecipe));
        setBrowseCuisines(response.data.cuisines);
        setBrowseTotal(response.data.total);
      } catch (requestError) {
        if (abortController.signal.aborted) return;
        setBrowseError(requestError instanceof Error ? requestError.message : 'Unable to load recipes.');
      } finally {
        if (!abortController.signal.aborted) setIsBrowseLoading(false);
      }
    };

    void loadBrowseRecipes();
    return () => abortController.abort();
  }, [activeTab, browsePage, browseSearch, browseIngredient, browseCuisine, browseSource, browseRetryKey]);

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

  const exploreContent = (
    <>
      <div style={styles.browseHeader}>
        <div>
          <h1 style={styles.resultsTitle}>Explore recipes</h1>
          <span style={styles.resultsCount}>{isBrowseLoading ? 'Loading recipes...' : `${browseTotal} recipes`}</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onContributeRecipe}>Add my recipe</Button>
      </div>

      <p style={styles.aiNotice}>Browse TheMealDB recipes. Approved user recipes will appear here when community publishing is available.</p>

      <div style={styles.browseFilters}>
        <Input.Search
          aria-label="Search recipe names"
          placeholder="Search recipes"
          maxLength={100}
          value={browseSearchInput}
          onChange={(event) => { setBrowseSearchInput(event.target.value); if (!event.target.value) { setBrowsePage(1); setBrowseSearch(''); } }}
          onSearch={(value) => { setBrowsePage(1); setBrowseSearch(value.trim()); }}
          style={styles.browseSearch}
          allowClear
        />
        <Input.Search
          aria-label="Filter by ingredient"
          placeholder="Ingredient"
          maxLength={80}
          value={ingredientInput}
          onChange={(event) => { setIngredientInput(event.target.value); if (!event.target.value) { setBrowsePage(1); setBrowseIngredient(''); } }}
          onSearch={(value) => { setBrowsePage(1); setBrowseIngredient(value.trim()); }}
          style={styles.browseSearch}
          allowClear
        />
        <Select
          aria-label="Filter by cuisine"
          value={browseCuisine}
          onChange={(value) => { setBrowsePage(1); setBrowseCuisine(value); }}
          options={[{ value: 'any', label: 'All cuisines' }, ...browseCuisines.map((cuisine) => ({ value: cuisine, label: cuisine[0].toUpperCase() + cuisine.slice(1) }))]}
          style={styles.browseSelect}
        />
        <Select
          aria-label="Filter by source"
          value={browseSource}
          onChange={(value) => { setBrowsePage(1); setBrowseSource(value); }}
          options={[...sourceOptions]}
          style={styles.browseSelect}
        />
      </div>

      {browseError ? (
        <div style={styles.emptyState}><p style={styles.emptyText}>{browseError}</p><Button onClick={() => setBrowseRetryKey((previous) => previous + 1)}>Try again</Button></div>
      ) : isBrowseLoading ? (
        <div style={styles.resultsGrid} aria-label="Loading recipes" aria-busy="true">
          {Array.from({ length: browsePageSize }, (_, index) => (
            <div key={index} style={styles.browseSkeletonCard}>
              <Skeleton.Image active styles={{ root: styles.browseSkeletonImageRoot }} style={styles.browseSkeletonImage} />
              <Skeleton active title={{ width: '70%' }} paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : browseRecipes.length > 0 ? (
        <>
          <div style={styles.resultsGrid}>
            {browseRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onSelect={onSelectRecipe} />)}
          </div>
          <Pagination current={browsePage} pageSize={browsePageSize} total={browseTotal} onChange={setBrowsePage} showSizeChanger={false} style={styles.browsePagination} />
        </>
      ) : (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No recipes match these filters yet.</p>
          <p style={styles.communityHint}>Try another cuisine or ingredient, or contribute a recipe.</p>
        </div>
      )}
    </>
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'for-you', label: 'For you', children: forYouContent },
            {
              key: 'explore',
              label: 'Explore recipes',
              children: exploreContent,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default RecipesPage;


