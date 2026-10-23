import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { DashboardPage } from './pages/DashboardPage';
import { RecipesPage } from './pages/RecipesPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import type { Recipe } from './types/recipe';
import type { ShoppingItem } from './types/shoppingList';
import './App.css';

// Initial shopping items based on the design mockup
const initialShoppingList: ShoppingItem[] = [
  { id: '1', name: 'Chicken breast', quantity: '500 g', checked: false },
  { id: '2', name: 'Potatoes', quantity: '4 medium', checked: false },
  { id: '3', name: 'Onion', quantity: '1', checked: false },
  { id: '4', name: 'Garlic', quantity: '3 cloves', checked: false },
  { id: '5', name: 'Chicken broth', quantity: '1 L', checked: false },
  { id: '6', name: 'Fresh parsley (optional)', quantity: '1 bunch', checked: false },
];

function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'recipes' | 'shopping-list'>('home');
  const [searchQuery, setSearchQuery] = useState('chicken + potatoes');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(initialShoppingList);

  // Tab change handler
  const handleTabChange = (tab: 'home' | 'recipes' | 'shopping-list') => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger search from Hero or search bar
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedRecipe(null); // return to recipe search grid
    setCurrentTab('recipes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Recipe selection (clicks on a card)
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentTab('recipes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add items from recipe to shopping list
  const handleAddToShoppingList = (items: ShoppingItem[]) => {
    setShoppingList((prev) => {
      // Append only items that are not already in the list
      const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
      const filteredNew = items.filter(
        (item) => !existingNames.has(item.name.toLowerCase())
      );
      return [...prev, ...filteredNew];
    });
  };

  // Shopping list item toggle
  const handleToggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Delete shopping item
  const handleDeleteShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear shopping list
  const handleClearShoppingList = () => {
    setShoppingList([]);
  };

  // Add custom shopping item
  const handleAddCustomShoppingItem = (name: string, quantity: string) => {
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name,
      quantity,
      checked: false,
    };
    setShoppingList((prev) => [newItem, ...prev]);
  };

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={currentTab}
        onTabChange={handleTabChange}
        shoppingListCount={shoppingList.filter((i) => !i.checked).length}
      />

      {/* Main Page Body */}
      <main className="app-main-content">
        {currentTab === 'home' && (
          <DashboardPage
            onSearch={handleSearch}
            onSelectRecipe={handleSelectRecipe}
            onViewAllRecipes={() => {
              setSelectedRecipe(null);
              setCurrentTab('recipes');
            }}
          />
        )}

        {currentTab === 'recipes' && (
          <RecipesPage
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            selectedRecipe={selectedRecipe}
            onSelectRecipe={setSelectedRecipe}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}

        {currentTab === 'shopping-list' && (
          <ShoppingListPage
            items={shoppingList}
            onToggleItem={handleToggleShoppingItem}
            onDeleteItem={handleDeleteShoppingItem}
            onClearAll={handleClearShoppingList}
            onAddItem={handleAddCustomShoppingItem}
            onExploreRecipes={() => {
              setSelectedRecipe(null);
              setCurrentTab('recipes');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={currentTab}
        onTabChange={handleTabChange}
        shoppingListCount={shoppingList.filter((i) => !i.checked).length}
      />
    </div>
  );
}

export default App;
