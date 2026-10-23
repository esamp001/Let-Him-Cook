import React, { useState, type CSSProperties } from 'react';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { RecipeCard } from '../components/RecipeCard';
import RecipeDetailPage from './RecipeDetailPage';
import { mockRecipes } from '../data/mockRecipes';
import type { Recipe } from '../types/recipe';
import type { ShoppingItem } from '../types/shoppingList';
import { culinaryPalette } from '../theme/themeConfig';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRecipe: Recipe | null;
  onSelectRecipe: (recipe: Recipe | null) => void;
  onAddToShoppingList: (items: ShoppingItem[]) => void;
}

const styles: Record<string, CSSProperties> = {
  wrapper: { padding: '32px 0 64px' },
  container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  searchRow: { marginBottom: 32 },
  searchForm: { maxWidth: 600 },
  searchWrapper: { display: 'flex', alignItems: 'center', backgroundColor: culinaryPalette.surface, border: `1px solid ${culinaryPalette.border}`, borderRadius: 9999, padding: '4px 6px 4px 18px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' },
  searchIcon: { color: culinaryPalette.textSubtle, fontSize: 18, display: 'flex', alignItems: 'center', marginRight: 12 },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 15, color: culinaryPalette.text, background: 'transparent', padding: '10px 0' },
  searchButton: { width: 44, height: 44, borderRadius: '50%', border: 'none', backgroundColor: culinaryPalette.primary, color: culinaryPalette.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', flexShrink: 0 },
  resultsHeader: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 },
  resultsTitle: { fontSize: 22, fontWeight: 700, color: culinaryPalette.text, margin: 0 },
  highlightedQuery: { color: culinaryPalette.primary },
  resultsCount: { fontSize: 14, color: culinaryPalette.textMuted, fontWeight: 500 },
  emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: culinaryPalette.surface, borderRadius: 16, border: `1px solid ${culinaryPalette.border}` },
  emptyText: { fontSize: 16, color: culinaryPalette.textSecondary, marginBottom: 16 },
  resetButton: { backgroundColor: culinaryPalette.primary, color: culinaryPalette.surface, border: 'none', padding: '10px 20px', borderRadius: 9999, fontWeight: 600, cursor: 'pointer' },
  resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 },
};

const RecipesPage = ({
  searchQuery,
  onSearchChange,
  selectedRecipe,
  onSelectRecipe,
  onAddToShoppingList,
}: Props) => {
  const [localInput, setLocalInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localInput.trim()) {
      onSearchChange(localInput.trim());
      onSelectRecipe(null); // return to results view
    }
  };

  // Filter recipes based on search query
  const filteredRecipes = mockRecipes.filter((r) => {
    if (!searchQuery.trim()) return true;
    const terms = searchQuery.toLowerCase().split(/[+,\s]+/).filter(Boolean);
    const titleMatch = terms.some((t) => r.title.toLowerCase().includes(t));
    const ingredientMatch = r.ingredients.some((ing) =>
      terms.some((t) => ing.name.toLowerCase().includes(t))
    );
    return titleMatch || ingredientMatch;
  });

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

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Search Bar Bar */}
        <div style={styles.searchRow}>
          <form style={styles.searchForm} onSubmit={handleSearchSubmit}>
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>
                <SearchOutlined />
              </span>
              <input
                type="text"
                style={styles.searchInput}
                placeholder="Search ingredients (e.g. chicken, potatoes)..."
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
              />
              <button
                type="submit"
                style={styles.searchButton}
                aria-label="Search"
              >
                <ArrowRightOutlined />
              </button>
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div style={styles.resultsHeader}>
          <h1 style={styles.resultsTitle}>
            Recipes for &ldquo;<span style={styles.highlightedQuery}>{searchQuery || 'all ingredients'}</span>&rdquo;
          </h1>
          <span style={styles.resultsCount}>
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div style={styles.resultsGrid}>
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={(selected) => onSelectRecipe(selected)}
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No recipes found matching your ingredients.</p>
            <button
              type="button"
              style={styles.resetButton}
              onClick={() => {
                setLocalInput('chicken + potatoes');
                onSearchChange('chicken + potatoes');
              }}
            >
              Reset to &ldquo;chicken + potatoes&rdquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesPage;


