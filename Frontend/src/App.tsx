import { useEffect, useState, type CSSProperties } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { ToastContainer } from './components/Toast';
import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import CookingChatPage from './pages/CookingChatPage';
import MyRecipesPage from './pages/MyRecipesPage';
import type { CuisinePreference, FallbackChoice } from './types/ai';
import type { ChatMessage } from './types/interfaces/ChatMessage';
import type { CookingConversation } from './types/interfaces/CookingConversation';
import type { CookingPlan } from './types/interfaces/CookingPlan';
import type { FallbackOption } from './types/interfaces/FallbackOption';
import type { Recipe } from './types/interfaces/Recipe';
import type { ShoppingItem } from './types/interfaces/ShoppingItem';
import type { AiChatResponse } from './types/interfaces/AiChatResponse';
import type { AiRecipe } from './types/interfaces/AiRecipe';
import { culinaryPalette } from './theme/themeConfig';
import generatedRecipeImage from './assets/Rustic Herb Chicken Bowl with Fresh Garnishes.png';

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
const conversationStorageKey = 'let-him-cook-conversations';
const personalRecipeStorageKey = 'let-him-cook-personal-recipes';

const emptyCookingPlan: CookingPlan = {
  ingredients: [],
  cuisine: 'any',
  preferences: [],
  questionCount: 0,
};

const getSavedConversations = (): CookingConversation[] => {
  try {
    const storedConversations = window.localStorage.getItem(conversationStorageKey);
    const parsedConversations: unknown = storedConversations ? JSON.parse(storedConversations) : [];

    return Array.isArray(parsedConversations) ? parsedConversations as CookingConversation[] : [];
  } catch {
    return [];
  }
};

const getSavedPersonalRecipes = (): Recipe[] => {
  try {
    const storedRecipes = window.localStorage.getItem(personalRecipeStorageKey);
    const parsedRecipes: unknown = storedRecipes ? JSON.parse(storedRecipes) : [];

    return Array.isArray(parsedRecipes) ? parsedRecipes as Recipe[] : [];
  } catch {
    return [];
  }
};

const mapAiRecipe = (recipe: AiRecipe): Recipe => {
  const availableIngredients = new Set(recipe.alreadyHave.map((ingredient) => ingredient.name.toLowerCase()));

  return {
    id: crypto.randomUUID(),
    title: recipe.title,
    description: `${recipe.description} ${recipe.recommendationReason}`,
    imageUrl: recipe.imageUrl ?? generatedRecipeImage,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      isOptional: ingredient.optional,
      isOwned: availableIngredients.has(ingredient.name.toLowerCase()),
    })),
    steps: recipe.steps,
  };
};


function App() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('chicken + potatoes');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(initialShoppingList);
  const [aiRecipes, setAiRecipes] = useState<Recipe[] | null>(null);

  const [aiPreferences, setAiPreferences] = useState<string[]>([]);
  const isAiSearchLoading = false;
  const aiSearchError = null;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [cookingPlan, setCookingPlan] = useState<CookingPlan>(emptyCookingPlan);
  const [conversations, setConversations] = useState<CookingConversation[]>(getSavedConversations);
  const [personalRecipes, setPersonalRecipes] = useState<Recipe[]>(getSavedPersonalRecipes);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(conversationStorageKey, JSON.stringify(conversations));
    } catch {
      // Conversation history remains available during this browser session if storage is full or unavailable.
    }
  }, [conversations]);

  useEffect(() => {
    try {
      window.localStorage.setItem(personalRecipeStorageKey, JSON.stringify(personalRecipes));
    } catch {
      // Personal recipes remain available during this browser session if storage is full or unavailable.
    }
  }, [personalRecipes]);

  useEffect(() => {
    if (!activeConversationId || chatMessages.length === 0) return;

    setConversations((previous) => previous.map((conversation) => (
      conversation.id === activeConversationId
        ? { ...conversation, messages: chatMessages, plan: cookingPlan, updatedAt: new Date().toISOString() }
        : conversation
    )));
  }, [activeConversationId, chatMessages, cookingPlan]);

  const createConversation = (title: string, plan: CookingPlan) => {
    const conversation: CookingConversation = {
      id: crypto.randomUUID(),
      title: title.trim().slice(0, 48) || 'New cooking idea',
      messages: [],
      plan,
      updatedAt: new Date().toISOString(),
    };

    setConversations((previous) => [conversation, ...previous].slice(0, 12));
    setActiveConversationId(conversation.id);
    return conversation.id;
  };

  const sendChatMessage = async (message: string, planForRequest = cookingPlan, conversationId = activeConversationId, fallbackChoice?: FallbackChoice) => {
    if (!conversationId) {
      createConversation(message, planForRequest);
    }

    setChatMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'user', content: message }]);
    setIsChatLoading(true);
    setChatError(null);

    try {
      const apiResponse = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, plan: planForRequest, fallbackChoice }),
      });

      const response = await apiResponse.json() as AiChatResponse;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to continue the cooking conversation.');
      }

      const chatData = response.data;
      setCookingPlan(chatData.plan);
      setChatMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: chatData.reply,
          followUpOptions: chatData.followUpOptions,
          fallbackOptions: chatData.fallbackOptions,
          recipes: chatData.recipes.map(mapAiRecipe),
        },
      ]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Unable to continue the cooking conversation.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Trigger search from Hero or search bar
  const handleSearch = (query: string, cuisinePreference: CuisinePreference = 'any') => {
    setSearchQuery(query);
    setSelectedRecipe(null);
    setAiRecipes([]);
    setAiPreferences([]);
    setChatError(null);

    const firstPlan = { ...emptyCookingPlan, cuisine: cuisinePreference };
    const conversationId = createConversation(query, firstPlan);
    setChatMessages([]);
    setCookingPlan(firstPlan);
    navigate('/Chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void sendChatMessage(query, firstPlan, conversationId);
  };

  const handleStartNewConversation = () => {
    setChatMessages([]);
    setCookingPlan(emptyCookingPlan);
    setActiveConversationId(null);
    setChatError(null);
  };

  const handleSelectFallback = (option: FallbackOption) => {
    void sendChatMessage(option.label, cookingPlan, activeConversationId, option.id);
  };

  const handleSelectConversation = (conversation: CookingConversation) => {
    setActiveConversationId(conversation.id);
    setChatMessages(conversation.messages);
    setCookingPlan(conversation.plan);
    setChatError(null);
  };

  const handleSavePersonalRecipe = (recipe: Recipe) => {
    setPersonalRecipes((previous) => [recipe, ...previous]);
  };

  const handleSelectPersonalRecipe = (recipe: Recipe) => {
    setAiRecipes(personalRecipes);
    setAiPreferences(['Private recipe']);
    setSelectedRecipe(recipe);
    navigate('/Recipes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContributeRecipe = () => {
    navigate('/My-Recipes');
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

  const handleViewConversationRecipes = (recipes: Recipe[]) => {
    setAiRecipes(recipes);
    setAiPreferences(cookingPlan.preferences);
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
            path="/Chat"
            element={
              <CookingChatPage
                messages={chatMessages}
                isLoading={isChatLoading}
                error={chatError}
                onSendMessage={sendChatMessage}
                onStartOver={handleStartNewConversation}
                onSelectRecipe={handleSelectRecipe}
                onViewAllRecipes={handleViewConversationRecipes}
                onSelectFallback={handleSelectFallback}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
              />
            }
          />
          <Route path="/chat" element={<Navigate to="/Chat" replace />} />
          <Route
            path="/Recipes"
            element={
              <RecipesPage
                searchQuery={searchQuery}
                recipes={aiRecipes}
                preferences={aiPreferences}
                isLoading={isAiSearchLoading}
                error={aiSearchError}
                selectedRecipe={selectedRecipe}
                onSelectRecipe={setSelectedRecipe}
                onAddToShoppingList={handleAddToShoppingList}
                onContributeRecipe={handleContributeRecipe}
              />
            }
          />
          <Route path="/recipes" element={<Navigate to="/Recipes" replace />} />
          <Route
            path="/My-Recipes"
            element={<MyRecipesPage recipes={personalRecipes} onSaveRecipe={handleSavePersonalRecipe} onSelectRecipe={handleSelectPersonalRecipe} />}
          />
          <Route path="/my-recipes" element={<Navigate to="/My-Recipes" replace />} />
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
