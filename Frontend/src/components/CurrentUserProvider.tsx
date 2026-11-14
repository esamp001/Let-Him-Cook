import { useCallback, useEffect, useMemo, useState } from 'react';
import { CurrentUserContext } from '../context/CurrentUserContext';
import type { ApiResponse } from '../types/interfaces/ApiResponse';
import type { AuthUser } from '../types/interfaces/AuthUser';
import type { ProviderProps } from '../types/interfaces/ProviderProps';

export const CurrentUserProvider = ({ children }: ProviderProps) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const apiResponse = await fetch('/api/v1/auth/me');
      const response = await apiResponse.json() as ApiResponse<{ user: AuthUser }>;

      // A 401 simply means nobody is signed in, so it is not treated as an error.
      setCurrentUser(apiResponse.ok && response.data ? response.data.user : null);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    void refreshCurrentUser();
  }, [refreshCurrentUser]);

  const signOut = useCallback(async () => {
    const apiResponse = await fetch('/api/v1/auth/sign-out', { method: 'POST' });

    if (!apiResponse.ok) {
      throw new Error('Unable to sign out.');
    }

    setCurrentUser(null);
  }, []);

  const signOutAllDevices = useCallback(async () => {
    const apiResponse = await fetch('/api/v1/auth/sign-out-all', { method: 'POST' });

    if (!apiResponse.ok) {
      throw new Error('Unable to sign out of all devices.');
    }

    setCurrentUser(null);
  }, []);

  const contextValue = useMemo(
    () => ({ currentUser, isLoadingUser, setCurrentUser, refreshCurrentUser, signOut, signOutAllDevices }),
    [currentUser, isLoadingUser, refreshCurrentUser, signOut, signOutAllDevices],
  );

  return (
    <CurrentUserContext.Provider value={contextValue}>
      {children}
    </CurrentUserContext.Provider>
  );
};
