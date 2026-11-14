import type { RequestHandler } from 'express';
import { getNewShoppingItems } from '../../back-end-helpers/shopping-list.helpers.js';
import { clearShoppingItems, deleteShoppingItem, insertShoppingItems, listShoppingItems, updateShoppingItem } from './shopping-list.repository.js';
import { addShoppingItemsRequestSchema, shoppingItemIdParamsSchema, updateShoppingItemRequestSchema } from './shopping-list.schemas.js';
import type { ShoppingListItem } from './interfaces/ShoppingListItem.js';

const itemNotFoundError = {
  error: {
    code: 'ITEM_NOT_FOUND',
    message: 'This shopping list item was not found.',
  },
} as const;

export const listItems: RequestHandler = async (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('listItems must run after requireAuth.');
  }

  let items: ShoppingListItem[] = [];

  try {
    items = await listShoppingItems(authUser.id);

    response.status(200).json({ data: { items } });
  } catch (error) {
    next(error);
  }
};

export const addItems: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('addItems must run after requireAuth.');
  }

  const parsedRequest = addShoppingItemsRequestSchema.safeParse(request.body);

  if (!parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Add at least one item with a name.',
        details: parsedRequest.error.flatten(),
      },
    });
    return;
  }

  const { items: requestedItems } = parsedRequest.data;

  let items: ShoppingListItem[] = [];
  let addedCount = 0;

  try {
    const existingItems = await listShoppingItems(authUser.id);
    const newItems = getNewShoppingItems(existingItems.map((item) => item.name), requestedItems);

    await insertShoppingItems(authUser.id, newItems);

    addedCount = newItems.length;
    items = await listShoppingItems(authUser.id);

    response.status(200).json({ data: { items, addedCount } });
  } catch (error) {
    next(error);
  }
};

export const updateItem: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('updateItem must run after requireAuth.');
  }

  const parsedParams = shoppingItemIdParamsSchema.safeParse(request.params);
  const parsedRequest = updateShoppingItemRequestSchema.safeParse(request.body);

  if (!parsedParams.success || !parsedRequest.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Send a valid item and checked value.',
      },
    });
    return;
  }

  const { itemId } = parsedParams.data;
  const { checked } = parsedRequest.data;

  try {
    // Filtering by user_id means another user's item is simply not found.
    if (await updateShoppingItem(authUser.id, itemId, checked) === 0) {
      response.status(404).json(itemNotFoundError);
      return;
    }

    response.status(200).json({ data: { id: itemId, checked } });
  } catch (error) {
    next(error);
  }
};

export const deleteItem: RequestHandler = async (request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('deleteItem must run after requireAuth.');
  }

  const parsedParams = shoppingItemIdParamsSchema.safeParse(request.params);

  if (!parsedParams.success) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The item ID is not valid.',
      },
    });
    return;
  }

  const { itemId } = parsedParams.data;

  try {
    if (await deleteShoppingItem(authUser.id, itemId) === 0) {
      response.status(404).json(itemNotFoundError);
      return;
    }

    response.status(200).json({ data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};

export const clearItems: RequestHandler = async (_request, response, next) => {
  const { authUser } = response.locals;

  if (!authUser) {
    throw new Error('clearItems must run after requireAuth.');
  }

  try {
    await clearShoppingItems(authUser.id);

    response.status(200).json({ data: { items: [] } });
  } catch (error) {
    next(error);
  }
};
