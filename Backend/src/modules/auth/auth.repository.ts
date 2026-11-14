import { randomUUID } from 'node:crypto';
import { toAuthUser } from '../../back-end-helpers/auth-user.helpers.js';
import { db } from '../../database/knex.js';
import type { AuthProvider, AuthTokenPurpose } from './auth.types.js';
import type { AuthUser } from './interfaces/AuthUser.js';
import type { UserRow } from './interfaces/UserRow.js';

const userColumns = ['users.id', 'users.email', 'users.name', 'users.role', 'users.email_verified_at'] as const;

export const findUserByEmail = async (email: string): Promise<UserRow | undefined> => {
  return db<UserRow>('users')
    .select('id', 'email', 'name', 'password_hash', 'role', 'email_verified_at')
    .where({ email })
    .first();
};

export const findUserByIdentity = async (provider: AuthProvider, providerUserId: string): Promise<AuthUser | undefined> => {
  const user = await db('users')
    .join('user_identities', 'users.id', 'user_identities.user_id')
    .select<UserRow>(...userColumns)
    .where({ 'user_identities.provider': provider, 'user_identities.provider_user_id': providerUserId })
    .first();

  return user ? toAuthUser(user) : undefined;
};

export const createUser = async (name: string, email: string, passwordHash: string): Promise<AuthUser> => {
  const [user] = await db('users')
    .insert({ id: randomUUID(), name, email, password_hash: passwordHash })
    .returning<UserRow[]>(['id', 'email', 'name', 'role', 'email_verified_at']);

  return toAuthUser(user);
};

export const createUserWithIdentity = async (name: string, email: string, provider: AuthProvider, providerUserId: string): Promise<AuthUser> => {
  return db.transaction(async (transaction) => {
    // The provider has already verified this email address.
    const [user] = await transaction('users')
      .insert({ id: randomUUID(), name, email, password_hash: null, email_verified_at: transaction.fn.now() })
      .returning<UserRow[]>(['id', 'email', 'name', 'role', 'email_verified_at']);

    await transaction('user_identities').insert({ id: randomUUID(), user_id: user.id, provider, provider_user_id: providerUserId, email });

    return toAuthUser(user);
  });
};

export const linkUserIdentity = async (userId: string, provider: AuthProvider, providerUserId: string, email: string): Promise<void> => {
  await db('user_identities').insert({ id: randomUUID(), user_id: userId, provider, provider_user_id: providerUserId, email });
};

export const markEmailVerified = async (userId: string): Promise<void> => {
  await db('users')
    .where({ id: userId })
    .whereNull('email_verified_at')
    .update({ email_verified_at: db.fn.now() });
};

export const updatePassword = async (userId: string, passwordHash: string): Promise<void> => {
  await db('users')
    .where({ id: userId })
    .update({ password_hash: passwordHash, updatedAt: db.fn.now() });
};

export const createSession = async (tokenHash: string, userId: string, expiresAt: Date): Promise<void> => {
  await db('user_sessions').insert({ token_hash: tokenHash, user_id: userId, expires_at: expiresAt });
};

export const findSessionUser = async (tokenHash: string): Promise<AuthUser | undefined> => {
  const user = await db('user_sessions')
    .join('users', 'users.id', 'user_sessions.user_id')
    .select<UserRow>(...userColumns)
    .where('user_sessions.token_hash', tokenHash)
    .andWhere('user_sessions.expires_at', '>', db.fn.now())
    .first();

  return user ? toAuthUser(user) : undefined;
};

export const deleteSession = async (tokenHash: string): Promise<void> => {
  await db('user_sessions').where({ token_hash: tokenHash }).delete();
};

export const deleteUserSessions = async (userId: string): Promise<number> => {
  return db('user_sessions').where({ user_id: userId }).delete();
};

export const deleteExpiredSessions = async (): Promise<number> => {
  return db('user_sessions').where('expires_at', '<=', db.fn.now()).delete();
};

export const createAuthToken = async (userId: string, purpose: AuthTokenPurpose, tokenHash: string, expiresAt: Date): Promise<void> => {
  await db.transaction(async (transaction) => {
    // Only the newest link of each kind works, so an older emailed link stops working.
    await transaction('auth_tokens').where({ user_id: userId, purpose }).whereNull('used_at').delete();
    await transaction('auth_tokens').insert({ id: randomUUID(), user_id: userId, purpose, token_hash: tokenHash, expires_at: expiresAt });
  });
};

export const consumeAuthToken = async (tokenHash: string, purpose: AuthTokenPurpose): Promise<string | undefined> => {
  // A single conditional UPDATE marks the token used, so the same link cannot be used twice.
  const [token] = await db('auth_tokens')
    .where({ token_hash: tokenHash, purpose })
    .whereNull('used_at')
    .andWhere('expires_at', '>', db.fn.now())
    .update({ used_at: db.fn.now() })
    .returning<{ user_id: string }[]>(['user_id']);

  return token?.user_id;
};

export const deleteExpiredAuthTokens = async (): Promise<number> => {
  return db('auth_tokens').where('expires_at', '<=', db.fn.now()).delete();
};
