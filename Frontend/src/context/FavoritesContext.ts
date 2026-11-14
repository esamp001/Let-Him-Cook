import { createContext } from 'react';
import type { FavoritesContextValue } from '../types/interfaces/FavoritesContextValue';

export const FavoritesContext = createContext<FavoritesContextValue | null>(null);
