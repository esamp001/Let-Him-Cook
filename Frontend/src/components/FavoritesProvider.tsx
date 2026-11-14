import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { FavoritesContext } from '../context/FavoritesContext';
import { buildLoginPath } from '../front-end-helpers/auth-redirect.helpers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { ApiResponse } from '../types/interfaces/ApiResponse';
import type { ProviderProps } from '../types/interfaces/ProviderProps';
import type { Recipe } from '../types/interfaces/Recipe';
import type { SavedRecipe } from '../types/interfaces/SavedRecipe';

export const FavoritesProvider = ({ children }: ProviderProps) => {
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [favorites, setFavorites] = useState<SavedRecipe[]>([]);
  const userId = currentUser?.id;

  // Reload favorites whenever a different user signs in, and clear them on sign-out.
  useEffect(() => {
    if (!userId) {
      setFavorites([]);
      return;
    }

    const loadFavorites = async () => {
      try {
        const apiResponse = await fetch('/api/v1/favorites');
        const response = await apiResponse.json() as ApiResponse<{ favorites: SavedRecipe[] }>;

        if (!apiResponse.ok || !response.data) {
          throw new Error(response.error?.message ?? 'Unable to load your saved recipes.');
        }

        setFavorites(response.data.favorites);
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Unable to load your saved recipes.');
      }
    };

    void loadFavorites();
  }, [userId]);

  const isFavorite = useCallback((recipeId: string) => favorites.some((favorite) => favorite.recipeKey === recipeId), [favorites]);

  const toggleFavorite = useCallback(async (recipe: Recipe) => {
    if (!userId) {
      message.info('Sign in to save recipes you love.');
      navigate(buildLoginPath(`${location.pathname}${location.search}`));
      return;
    }

    const wasFavorite = favorites.some((favorite) => favorite.recipeKey === recipe.id);

    try {
      const apiResponse = wasFavorite
        ? await fetch(`/api/v1/favorites/${encodeURIComponent(recipe.id)}`, { method: 'DELETE' })
        : await fetch('/api/v1/favorites', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe }),
        });
      const response = await apiResponse.json() as ApiResponse<{ recipeKey: string; saved: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to update your saved recipes.');
      }

      setFavorites((previousFavorites) => wasFavorite
        ? previousFavorites.filter((favorite) => favorite.recipeKey !== recipe.id)
        : [{ recipeKey: recipe.id, recipe, savedAt: new Date().toISOString() }, ...previousFavorites]);
      message.success(wasFavorite ? 'Removed from your saved recipes.' : 'Saved to your recipes.');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update your saved recipes.');
    }
  }, [favorites, location.pathname, location.search, navigate, userId]);

  const contextValue = useMemo(() => ({ favorites, isFavorite, toggleFavorite }), [favorites, isFavorite, toggleFavorite]);

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
};
