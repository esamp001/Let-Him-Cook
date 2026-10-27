import { ArrowRightOutlined } from '@ant-design/icons';
import { RecipeCard } from './RecipeCard';
import { mockRecipes } from '../data/mockRecipes';
import type { PopularRecipesProps } from '../types/interfaces/PopularRecipesProps';
import './PopularRecipes.css';

export const PopularRecipes = ({
  onSelectRecipe,
  onViewAll,
}: PopularRecipesProps) => {
  // First 4 recipes for the popular dashboard section
  const popular = mockRecipes.slice(0, 4);

  return (
    <section className="popular-recipes-section">
      <div className="popular-recipes-container">
        <div className="section-header">
          <h2 className="section-title">Popular Recipes</h2>
          <button
            type="button"
            className="view-all-btn"
            onClick={onViewAll}
          >
            View all <ArrowRightOutlined />
          </button>
        </div>

        <div className="recipes-grid">
          {popular.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSelect={onSelectRecipe}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
