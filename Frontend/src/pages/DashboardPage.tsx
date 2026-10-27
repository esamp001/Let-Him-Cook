import { HeroSection } from '../components/HeroSection';
import { PopularRecipes } from '../components/PopularRecipes';
import type { DashboardPageProps } from '../types/interfaces/DashboardPageProps';

const DashboardPage = ({
  onSearch,
  onSelectRecipe,
  onViewAllRecipes,
}: DashboardPageProps) => {
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
