import { Router } from 'express';
import { browseRecipes } from './recipe.controller.js';

export const recipeRouter = Router();

recipeRouter.get('/', browseRecipes);
