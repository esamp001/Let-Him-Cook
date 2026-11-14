import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { addItems, clearItems, deleteItem, listItems, updateItem } from './shopping-list.controller.js';

export const shoppingListRouter = Router();

shoppingListRouter.use(requireAuth);

shoppingListRouter.get('/items', listItems);
shoppingListRouter.post('/items', addItems);
shoppingListRouter.delete('/items', clearItems);
shoppingListRouter.patch('/items/:itemId', updateItem);
shoppingListRouter.delete('/items/:itemId', deleteItem);
