import type { CookingPlan } from '../../ai/ai.types.js';
import type { ConversationMessage } from '../conversations.types.js';

export interface ConversationRow {
  id: string;
  title: string;
  messages: ConversationMessage[];
  plan: CookingPlan;
  updatedAt: Date;
}
