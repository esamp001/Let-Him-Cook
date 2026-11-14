import type { z } from 'zod';
import type { addShoppingItemsRequestSchema } from './shopping-list.schemas.js';

export type NewShoppingListItem = z.infer<typeof addShoppingItemsRequestSchema>['items'][number];
