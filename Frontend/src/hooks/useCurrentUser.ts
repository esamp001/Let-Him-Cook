import { useEffect, useState } from 'react';
import type { AuthApiResponse } from '../types/interfaces/AuthApiResponse';
import type { AuthUser } from '../types/interfaces/AuthUser';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const apiResponse = await fetch('/api/v1/auth/me');
        const response = await apiResponse.json() as AuthApiResponse;

        // A 401 simply means nobody is signed in, so it is not treated as an error.
        setCurrentUser(apiResponse.ok && response.data ? response.data.user : null);
      } catch {
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    void loadCurrentUser();
  }, []);

  const signOut = async () => {
    const apiResponse = await fetch('/api/v1/auth/sign-out', { method: 'POST' });

    if (!apiResponse.ok) {
      throw new Error('Unable to sign out.');
    }

    setCurrentUser(null);
  };

  return { currentUser, isLoadingUser, signOut };
};
