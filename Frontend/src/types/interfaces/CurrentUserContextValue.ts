import type { AuthUser } from './AuthUser';

export interface CurrentUserContextValue {
  currentUser: AuthUser | null;
  isLoadingUser: boolean;
  setCurrentUser: (user: AuthUser | null) => void;
  refreshCurrentUser: () => Promise<void>;
  signOut: () => Promise<void>;
  signOutAllDevices: () => Promise<void>;
}
