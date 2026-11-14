import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { listMyConversations, saveMyConversation } from './conversations.controller.js';

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

conversationsRouter.get('/', listMyConversations);
conversationsRouter.put('/:conversationId', saveMyConversation);
