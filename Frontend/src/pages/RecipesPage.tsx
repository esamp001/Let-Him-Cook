import React, { useState } from 'react';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { RecipeCard } from '../components/RecipeCard';
import RecipeDetailPage from './RecipeDetailPage';
import { mockRecipes } from '../data/mockRecipes';
import type { Recipe } from '../types/recipe';
import type { ShoppingItem } from '../types/shoppingList';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRecipe: Recipe | null;
  onSelectRecipe: (recipe: Recipe | null) => void;
  onAddToShoppingList: (items: ShoppingItem[]) => void;
}

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
      <div className="recipes-page-wrapper">
        <RecipeDetailPage
          recipe={selectedRecipe}
          onBack={() => onSelectRecipe(null)}
          onAddToShoppingList={onAddToShoppingList}
        />
      </div>
    );
  }

  return (
    <div className="recipes-page-wrapper">
      <div className="recipes-page-container">
        {/* Search Bar Bar */}
        <div className="recipes-search-bar-row">
          <form className="recipes-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-bar-wrapper">
              <span className="search-icon-circle">
                <SearchOutlined />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search ingredients (e.g. chicken, potatoes)..."
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
              />
              <button
                type="submit"
                className="search-submit-btn"
                aria-label="Search"
              >
                <ArrowRightOutlined />
              </button>
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="recipes-results-header">
          <h1 className="recipes-results-title">
            Recipes for &ldquo;<span className="highlight-query">{searchQuery || 'all ingredients'}</span>&rdquo;
          </h1>
          <span className="results-count-badge">
            {filteredRecipes.length} {filteredRecipes.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="recipes-grid full-grid">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={(selected) => onSelectRecipe(selected)}
              />
            ))}
          </div>
        ) : (
          <div className="no-recipes-found">
            <p className="no-recipes-text">No recipes found matching your ingredients.</p>
            <button
              type="button"
              className="reset-search-btn"
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


