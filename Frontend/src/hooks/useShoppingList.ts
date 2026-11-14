import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useCurrentUser } from './useCurrentUser';
import type { ApiResponse } from '../types/interfaces/ApiResponse';
import type { ShoppingItem } from '../types/interfaces/ShoppingItem';

export const useShoppingList = () => {
  const { currentUser } = useCurrentUser();
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const userId = currentUser?.id;

  // Each user has their own list; signing out clears it from the screen.
  useEffect(() => {
    if (!userId) {
      setShoppingList([]);
      return;
    }

    const loadShoppingList = async () => {
      try {
        const apiResponse = await fetch('/api/v1/shopping-list/items');
        const response = await apiResponse.json() as ApiResponse<{ items: ShoppingItem[] }>;

        if (!apiResponse.ok || !response.data) {
          throw new Error(response.error?.message ?? 'Unable to load your shopping list.');
        }

        setShoppingList(response.data.items);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Unable to load your shopping list.');
      }
    };

    void loadShoppingList();
  }, [userId]);

  const addShoppingItems = useCallback(async (items: Pick<ShoppingItem, 'name' | 'quantity'>[]) => {
    try {
      const apiResponse = await fetch('/api/v1/shopping-list/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const response = await apiResponse.json() as ApiResponse<{ items: ShoppingItem[]; addedCount: number }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to add to your shopping list.');
      }

      setShoppingList(response.data.items);
      message.success(response.data.addedCount > 0
        ? `Added ${response.data.addedCount} item(s) to your shopping list.`
        : 'Those items are already on your shopping list.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to add to your shopping list.');
    }
  }, []);

  const toggleShoppingItem = useCallback(async (itemId: string) => {
    const item = shoppingList.find((shoppingItem) => shoppingItem.id === itemId);

    if (!item) return;

    try {
      const apiResponse = await fetch(`/api/v1/shopping-list/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !item.checked }),
      });

      const response = await apiResponse.json() as ApiResponse<{ id: string; checked: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to update the item.');
      }

      const { checked } = response.data;
      setShoppingList((previousList) => previousList.map((shoppingItem) => shoppingItem.id === itemId ? { ...shoppingItem, checked } : shoppingItem));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update the item.');
    }
  }, [shoppingList]);

  const deleteShoppingItem = useCallback(async (itemId: string) => {
    try {
      const apiResponse = await fetch(`/api/v1/shopping-list/items/${itemId}`, { method: 'DELETE' });
      const response = await apiResponse.json() as ApiResponse<{ deleted: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to remove the item.');
      }

      setShoppingList((previousList) => previousList.filter((shoppingItem) => shoppingItem.id !== itemId));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to remove the item.');
    }
  }, []);

  const clearShoppingList = useCallback(async () => {
    try {
      const apiResponse = await fetch('/api/v1/shopping-list/items', { method: 'DELETE' });
      const response = await apiResponse.json() as ApiResponse<{ items: ShoppingItem[] }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to clear your shopping list.');
      }

      setShoppingList([]);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to clear your shopping list.');
    }
  }, []);

  return { shoppingList, addShoppingItems, toggleShoppingItem, deleteShoppingItem, clearShoppingList };
};
