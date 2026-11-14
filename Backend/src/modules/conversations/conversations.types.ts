import type { z } from 'zod';
import type { conversationMessageSchema } from './conversations.schemas.js';

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
