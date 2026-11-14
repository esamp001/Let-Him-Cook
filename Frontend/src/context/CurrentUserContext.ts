import { createContext } from 'react';
import type { CurrentUserContextValue } from '../types/interfaces/CurrentUserContextValue';

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);
