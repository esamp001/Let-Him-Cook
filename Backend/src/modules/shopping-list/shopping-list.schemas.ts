import { z } from 'zod';

export const addShoppingItemsRequestSchema = z.object({
  items: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    quantity: z.string().trim().max(120).default('1'),
  })).min(1).max(60),
});

export const shoppingItemIdParamsSchema = z.object({
  itemId: z.string().uuid(),
});

export const updateShoppingItemRequestSchema = z.object({
  checked: z.boolean(),
});
