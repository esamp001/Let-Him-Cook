import { randomUUID } from 'node:crypto';
import { db } from '../../database/knex.js';
import type { NewShoppingListItem } from './shopping-list.types.js';
import type { ShoppingListItem } from './interfaces/ShoppingListItem.js';

export const listShoppingItems = async (userId: string): Promise<ShoppingListItem[]> => {
  return db<ShoppingListItem & { user_id: string }>('shopping_list_items')
    .select('id', 'name', 'quantity', 'checked')
    .where({ user_id: userId })
    .orderBy('createdAt', 'desc');
};

export const insertShoppingItems = async (userId: string, items: NewShoppingListItem[]): Promise<void> => {
  if (items.length === 0) return;

  await db('shopping_list_items').insert(items.map((item) => ({ id: randomUUID(), user_id: userId, name: item.name, quantity: item.quantity })));
};

export const updateShoppingItem = async (userId: string, itemId: string, checked: boolean): Promise<number> => {
  return db('shopping_list_items')
    .where({ id: itemId, user_id: userId })
    .update({ checked, updatedAt: db.fn.now() });
};

export const deleteShoppingItem = async (userId: string, itemId: string): Promise<number> => {
  return db('shopping_list_items').where({ id: itemId, user_id: userId }).delete();
};

export const clearShoppingItems = async (userId: string): Promise<void> => {
  await db('shopping_list_items').where({ user_id: userId }).delete();
};
