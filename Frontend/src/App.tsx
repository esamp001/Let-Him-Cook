import { useState, type CSSProperties } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { ToastContainer } from './components/Toast';
import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import type { Recipe } from './types/recipe';
import type { ShoppingItem } from './types/shoppingList';
import { culinaryPalette } from './theme/themeConfig';

// Initial shopping items based on the design mockup
const initialShoppingList: ShoppingItem[] = [
  { id: '1', name: 'Chicken breast', quantity: '500 g', checked: false },
  { id: '2', name: 'Potatoes', quantity: '4 medium', checked: false },
  { id: '3', name: 'Onion', quantity: '1', checked: false },
  { id: '4', name: 'Garlic', quantity: '3 cloves', checked: false },
  { id: '5', name: 'Chicken broth', quantity: '1 L', checked: false },
  { id: '6', name: 'Fresh parsley (optional)', quantity: '1 bunch', checked: false },
];

const appShellStyle: CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: culinaryPalette.pageBackground };
const mainContentStyle: CSSProperties = { flex: 1 };

function App() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('chicken + potatoes');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(initialShoppingList);

  // Trigger search from Hero or search bar
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedRecipe(null);
    navigate('/Recipes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Recipe selection (clicks on a card)
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    navigate('/Recipes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAllRecipes = () => {
    setSelectedRecipe(null);
    navigate('/Recipes');
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

  const handleExploreRecipes = () => {
    setSelectedRecipe(null);
    navigate('/Recipes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={appShellStyle}>
      {/* Top Navigation Bar */}
      <Navbar shoppingListCount={shoppingList.filter((i) => !i.checked).length} />

      {/* Main Page Body */}
      <main style={mainContentStyle}>
        <Routes>
          <Route path="/" element={<Navigate to="/Home" replace />} />
          <Route
            path="/Home"
            element={
              <DashboardPage
                onSearch={handleSearch}
                onSelectRecipe={handleSelectRecipe}
                onViewAllRecipes={handleViewAllRecipes}
              />
            }
          />
          <Route path="/home" element={<Navigate to="/Home" replace />} />
          <Route
            path="/Recipes"
            element={
              <RecipesPage
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                selectedRecipe={selectedRecipe}
                onSelectRecipe={setSelectedRecipe}
                onAddToShoppingList={handleAddToShoppingList}
              />
            }
          />
          <Route path="/recipes" element={<Navigate to="/Recipes" replace />} />
          <Route
            path="/Shopping-List"
            element={
              <ShoppingListPage
                items={shoppingList}
                onToggleItem={handleToggleShoppingItem}
                onDeleteItem={handleDeleteShoppingItem}
                onClearAll={handleClearShoppingList}
                onAddItem={handleAddCustomShoppingItem}
                onExploreRecipes={handleExploreRecipes}
              />
            }
          />
          <Route path="/shopping-list" element={<Navigate to="/Shopping-List" replace />} />
          <Route path="*" element={<Navigate to="/Home" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav shoppingListCount={shoppingList.filter((i) => !i.checked).length} />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
