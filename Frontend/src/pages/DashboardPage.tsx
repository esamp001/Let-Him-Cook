import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { PopularRecipes } from '../components/PopularRecipes';
import type { Recipe } from '../types/recipe';

interface DashboardPageProps {
  onSearch: (ingredients: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onViewAllRecipes: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSearch,
  onSelectRecipe,
  onViewAllRecipes,
}) => {
  return (
    <div className="dashboard-content">
      <HeroSection onSearch={onSearch} />
      <PopularRecipes
        onSelectRecipe={onSelectRecipe}
        onViewAll={onViewAllRecipes}
      />
    </div>
  );
};
