import { Router } from 'express';
import { continueCookingConversation, createRecipeDraft, generateRecipes } from './ai.controller.js';

export const aiRouter = Router();

aiRouter.post('/recipes', generateRecipes);
aiRouter.post('/recipe-drafts', createRecipeDraft);
aiRouter.post('/chat', continueCookingConversation);
