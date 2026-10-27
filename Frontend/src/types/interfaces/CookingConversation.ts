import type { ChatMessage } from './ChatMessage';
import type { CookingPlan } from './CookingPlan';

export interface CookingConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  plan: CookingPlan;
  updatedAt: string;
}
