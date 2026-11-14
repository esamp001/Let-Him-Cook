import { z } from 'zod';
import { cookingPlanSchema } from '../ai/ai.types.js';

// Messages keep extra display fields (recipes, follow-up options) so a saved chat reopens exactly as it was.
export const conversationMessageSchema = z.object({
  id: z.string().min(1).max(64),
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8_000),
}).passthrough();

export const conversationIdParamsSchema = z.object({
  conversationId: z.string().uuid(),
});

export const saveConversationRequestSchema = z.object({
  title: z.string().trim().min(1).transform((title) => title.slice(0, 60)),
  messages: z.array(conversationMessageSchema).max(200),
  plan: cookingPlanSchema,
});
