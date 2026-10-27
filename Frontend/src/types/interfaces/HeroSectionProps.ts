import type { CuisinePreference } from '../ai';

export interface HeroSectionProps {
  onSearch: (ingredients: string, cuisinePreference: CuisinePreference) => void;
}
