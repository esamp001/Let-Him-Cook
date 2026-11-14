import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { addFavorite, listFavorites, removeFavorite } from './favorites.controller.js';

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get('/', listFavorites);
favoritesRouter.put('/', addFavorite);
favoritesRouter.delete('/:recipeKey', removeFavorite);
