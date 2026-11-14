import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { listModerationRecipes, listRecipeReports, moderateRecipe, updateRecipeReport } from './moderation.controller.js';

export const moderationRouter = Router();

// Every moderation route is admin-only.
moderationRouter.use(requireAuth, requireRole('admin'));

moderationRouter.get('/recipes', listModerationRecipes);
moderationRouter.post('/recipes/:recipeId/actions', moderateRecipe);
moderationRouter.get('/reports', listRecipeReports);
moderationRouter.patch('/reports/:reportId', updateRecipeReport);
