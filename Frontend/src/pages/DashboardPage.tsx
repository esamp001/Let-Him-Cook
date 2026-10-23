import { HeroSection } from '../components/HeroSection';
import { PopularRecipes } from '../components/PopularRecipes';
import type { Recipe } from '../types/recipe';

interface Props {
  onSearch: (ingredients: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onViewAllRecipes: () => void;
}

const DashboardPage = ({
  onSearch,
  onSelectRecipe,
  onViewAllRecipes,
}: Props) => {
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

export default DashboardPage;
