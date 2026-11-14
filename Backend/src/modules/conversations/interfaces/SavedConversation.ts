import type { CookingPlan } from '../../ai/ai.types.js';
import type { ConversationMessage } from '../conversations.types.js';

export interface SavedConversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  plan: CookingPlan;
  updatedAt: string;
}
