import type { ShoppingItem } from './ShoppingItem';

export interface ShoppingListPageProps {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onAddItem: (name: string, quantity: string) => void;
  onExploreRecipes: () => void;
}
