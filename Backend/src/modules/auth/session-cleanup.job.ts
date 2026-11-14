import { deleteExpiredAuthTokens, deleteExpiredSessions } from './auth.repository.js';

const cleanupIntervalMilliseconds = 60 * 60 * 1_000;

const removeExpiredRows = async (): Promise<void> => {
  try {
    const deletedSessions = await deleteExpiredSessions();
    const deletedTokens = await deleteExpiredAuthTokens();

    if (deletedSessions + deletedTokens > 0) {
      console.log(`Session cleanup removed ${deletedSessions} expired session(s) and ${deletedTokens} expired link token(s).`);
    }
  } catch (error) {
    // A failed run is retried on the next interval; it must not stop the server.
    console.error('Session cleanup failed.', error);
  }
};

// Runs once at startup and then every hour while the server is running.
export const startSessionCleanupJob = (): void => {
  void removeExpiredRows();
  setInterval(() => void removeExpiredRows(), cleanupIntervalMilliseconds).unref();
};
