import { db } from '../../database/knex.js';
import type { CookingPlan } from '../ai/ai.types.js';
import type { ConversationMessage } from './conversations.types.js';
import type { ConversationRow } from './interfaces/ConversationRow.js';
import type { SavedConversation } from './interfaces/SavedConversation.js';

const conversationHistoryLimit = 20;

export const listConversations = async (userId: string): Promise<SavedConversation[]> => {
  const rows = await db('chat_conversations')
    .select<ConversationRow[]>('id', 'title', 'messages', 'plan', 'updatedAt')
    .where({ user_id: userId })
    .orderBy('updatedAt', 'desc')
    .limit(conversationHistoryLimit);

  return rows.map((row) => ({ id: row.id, title: row.title, messages: row.messages, plan: row.plan, updatedAt: row.updatedAt.toISOString() }));
};

export const findConversationOwnerId = async (conversationId: string): Promise<string | undefined> => {
  const conversation = await db('chat_conversations')
    .select<{ user_id: string }>('user_id')
    .where({ id: conversationId })
    .first();

  return conversation?.user_id;
};

export const saveConversation = async (userId: string, conversationId: string, title: string, messages: ConversationMessage[], plan: CookingPlan): Promise<void> => {
  // The pg driver sends JS arrays as Postgres arrays, so jsonb values are serialized explicitly.
  const values = { title, messages: JSON.stringify(messages), plan: JSON.stringify(plan) };

  await db('chat_conversations')
    .insert({ id: conversationId, user_id: userId, ...values })
    .onConflict('id')
    .merge({ ...values, updatedAt: db.fn.now() });
};
