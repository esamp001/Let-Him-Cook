import { Router } from 'express';
import { optionalAuth } from '../../middleware/optionalAuth.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireVerifiedEmail } from '../../middleware/requireVerifiedEmail.js';
import { createMyRecipe, deleteMyRecipe, getFeedback, listMyRecipes, removeReaction, reportRecipe, setReaction, submitMyRecipe } from './community.controller.js';

export const communityRouter = Router();

communityRouter.get('/my-recipes', requireAuth, listMyRecipes);
communityRouter.post('/recipes', requireAuth, createMyRecipe);
communityRouter.delete('/recipes/:recipeId', requireAuth, deleteMyRecipe);
communityRouter.post('/recipes/:recipeId/submit', requireAuth, requireVerifiedEmail, submitMyRecipe);
communityRouter.get('/recipes/:recipeId/feedback', optionalAuth, getFeedback);
communityRouter.put('/recipes/:recipeId/reaction', requireAuth, requireVerifiedEmail, setReaction);
communityRouter.delete('/recipes/:recipeId/reaction', requireAuth, requireVerifiedEmail, removeReaction);
communityRouter.post('/recipes/:recipeId/reports', requireAuth, requireVerifiedEmail, reportRecipe);
