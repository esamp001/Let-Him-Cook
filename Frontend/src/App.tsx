import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { message } from 'antd';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { ToastContainer } from './components/Toast';
import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import CookingChatPage from './pages/CookingChatPage';
import MyRecipesPage from './pages/MyRecipesPage';
import LoginPage from './pages/LoginPage';
import ModerationPage from './pages/ModerationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { buildLoginPath } from './front-end-helpers/auth-redirect.helpers';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useShoppingList } from './hooks/useShoppingList';
import type { CuisinePreference, FallbackChoice } from './types/ai';
import type { ApiResponse } from './types/interfaces/ApiResponse';
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

const appShellStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: culinaryPalette.pageBackground
};
const mainContentStyle: CSSProperties = {
  flex: 1
};

const emptyCookingPlan: CookingPlan = {
  ingredients: [],
  cuisine: 'any',
  preferences: [],
  questionCount: 0,
};

const mapAiRecipe = (recipe: AiRecipe): Recipe => {
  const availableIngredients = new Set(recipe.alreadyHave.map((ingredient) => ingredient.name.toLowerCase()));

  return {
    id: recipe.id,
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
  const location = useLocation();
  const isAuthPage = location.pathname.toLowerCase() === '/login';
  const { currentUser } = useCurrentUser();
  const userId = currentUser?.id;
  const { shoppingList, addShoppingItems, toggleShoppingItem, deleteShoppingItem, clearShoppingList } = useShoppingList();
  const [searchQuery, setSearchQuery] = useState('chicken + potatoes');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [aiRecipes, setAiRecipes] = useState<Recipe[] | null>(null);

  const [aiPreferences, setAiPreferences] = useState<string[]>([]);
  const isAiSearchLoading = false;
  const aiSearchError = null;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [cookingPlan, setCookingPlan] = useState<CookingPlan>(emptyCookingPlan);
  const [conversations, setConversations] = useState<CookingConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  // Read inside the sign-in effect so a guest's chats can be saved to the new account without re-running it.
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Conversation history belongs to the signed-in user. Guests keep chats only until they leave the page.
  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setChatMessages([]);
      setActiveConversationId(null);
      return;
    }

    const loadConversations = async () => {
      try {
        // Keep any chats started before signing in by saving them to the account first.
        for (const conversation of conversationsRef.current.filter((guestConversation) => guestConversation.messages.length > 0)) {
          await fetch(`/api/v1/conversations/${conversation.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: conversation.title, messages: conversation.messages, plan: conversation.plan }),
          });
        }

        const apiResponse = await fetch('/api/v1/conversations');
        const response = await apiResponse.json() as ApiResponse<{ conversations: CookingConversation[] }>;

        if (!apiResponse.ok || !response.data) {
          throw new Error(response.error?.message ?? 'Unable to load your conversations.');
        }

        setConversations(response.data.conversations);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Unable to load your conversations.');
      }
    };

    void loadConversations();
  }, [userId]);

  // Save the open conversation to the account whenever it changes.
  useEffect(() => {
    const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);

    if (!userId || !activeConversation || activeConversation.messages.length === 0) return;

    const saveConversation = async () => {
      try {
        const apiResponse = await fetch(`/api/v1/conversations/${activeConversation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: activeConversation.title, messages: activeConversation.messages, plan: activeConversation.plan }),
        });

        const response = await apiResponse.json() as ApiResponse<{ saved: boolean }>;

        if (!apiResponse.ok || !response.data) {
          throw new Error(response.error?.message ?? 'Unable to save this conversation.');
        }
      } catch (error) {
        message.error({ content: error instanceof Error ? error.message : 'Unable to save this conversation.', key: 'conversation-save' });
      }
    };

    void saveConversation();
  }, [activeConversationId, conversations, userId]);

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

    // A new search starts a new conversation, so recipes from the previous one are not "shown" anymore.
    const shownRecipeIds = conversationId !== activeConversationId ? [] : [...chatMessages].reverse().find((chatMessage) => chatMessage.recipes?.length)?.recipes?.slice(0, 10).map((recipe) => recipe.id) ?? [];

    setChatMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'user', content: message }]);
    setIsChatLoading(true);
    setChatError(null);

    try {
      const apiResponse = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, plan: planForRequest, fallbackChoice, shownRecipeIds }),
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
    if (option.id === 'add_recipe') {
      navigate('/My-Recipes');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    void sendChatMessage(option.label, cookingPlan, activeConversationId, option.id);
  };

  const handleSelectConversation = (conversation: CookingConversation) => {
    setActiveConversationId(conversation.id);
    setChatMessages(conversation.messages);
    setCookingPlan(conversation.plan);
    setChatError(null);
  };

  const handleSelectPersonalRecipe = (recipe: Recipe, recipes: Recipe[]) => {
    setAiRecipes(recipes);
    setAiPreferences(['My recipes']);
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

  // Add items from a recipe to the signed-in user's shopping list
  const handleAddToShoppingList = (items: ShoppingItem[]) => {
    if (!currentUser) {
      message.info('Sign in to keep a shopping list.');
      navigate(buildLoginPath(`${location.pathname}${location.search}`));
      return;
    }

    void addShoppingItems(items.map(({ name, quantity }) => ({ name, quantity })));
  };

  // Add custom shopping item
  const handleAddCustomShoppingItem = (name: string, quantity: string) => {
    void addShoppingItems([{ name, quantity }]);
  };

  const handleExploreRecipes = () => {
    setSelectedRecipe(null);
    navigate('/Recipes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={appShellStyle}>
      {/* Top Navigation Bar */}
      {!isAuthPage && <Navbar shoppingListCount={shoppingList.filter((i) => !i.checked).length} />}
      {!isAuthPage && <EmailVerificationBanner />}

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
            element={<MyRecipesPage onSelectRecipe={handleSelectPersonalRecipe} />}
          />
          <Route path="/my-recipes" element={<Navigate to="/My-Recipes" replace />} />
          <Route path="/Login" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/Login" replace />} />
          <Route path="/Verify-Email" element={<VerifyEmailPage />} />
          <Route path="/Reset-Password" element={<ResetPasswordPage />} />
          <Route path="/Moderation" element={<ModerationPage />} />
          <Route path="/moderation" element={<Navigate to="/Moderation" replace />} />
          <Route
            path="/Shopping-List"
            element={
              <ShoppingListPage
                items={shoppingList}
                onToggleItem={toggleShoppingItem}
                onDeleteItem={deleteShoppingItem}
                onClearAll={clearShoppingList}
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
      {!isAuthPage && <MobileNav shoppingListCount={shoppingList.filter((i) => !i.checked).length} />}

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
