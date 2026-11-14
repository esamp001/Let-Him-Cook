const communityRecipePrefix = 'community:';

/**
 * Name: getCommunityRecipeId.
 * Returns: The community recipe's database ID, or null when the recipe is not a community recipe.
 * Parameters: recipeId, the app-wide recipe ID such as 'community:<uuid>' or 'themealdb:52772'.
 * Description: Extracts the ID that the community API routes expect from the prefixed recipe ID.
 */
export const getCommunityRecipeId = (recipeId: string): string | null => {
  return recipeId.startsWith(communityRecipePrefix) ? recipeId.slice(communityRecipePrefix.length) : null;
};
