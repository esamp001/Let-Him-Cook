import { useContext } from 'react';
import { CurrentUserContext } from '../context/CurrentUserContext';

export const useCurrentUser = () => {
  const currentUserContext = useContext(CurrentUserContext);

  if (!currentUserContext) {
    throw new Error('useCurrentUser must be used inside CurrentUserProvider.');
  }

  return currentUserContext;
};
