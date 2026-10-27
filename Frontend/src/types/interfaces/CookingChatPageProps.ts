import type { ChatMessage } from './ChatMessage';
import type { CookingConversation } from './CookingConversation';
import type { FallbackOption } from './FallbackOption';
import type { Recipe } from './Recipe';

export interface CookingChatPageProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onStartOver: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onViewAllRecipes: (recipes: Recipe[]) => void;
  onSelectFallback: (option: FallbackOption) => void;
  conversations: CookingConversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: CookingConversation) => void;
}
