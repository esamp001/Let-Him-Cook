import type { NewShoppingListItem } from '../modules/shopping-list/shopping-list.types.js';

/**
 * Name: getNewShoppingItems.
 * Returns: The items whose names are not already on the list, without repeats.
 * Parameters: existingNames, names already on the user's list; items, the items being added.
 * Description: Compares names case-insensitively so adding a recipe twice does not duplicate ingredients.
 */
export const getNewShoppingItems = (existingNames: string[], items: NewShoppingListItem[]): NewShoppingListItem[] => {
  const seenNames = new Set(existingNames.map((name) => name.trim().toLowerCase()));

  return items.filter((item) => {
    const normalizedName = item.name.trim().toLowerCase();

    if (seenNames.has(normalizedName)) return false;

    seenNames.add(normalizedName);
    return true;
  });
};
