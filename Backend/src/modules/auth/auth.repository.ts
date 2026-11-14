import { randomUUID } from 'node:crypto';
import { db } from '../../database/knex.js';
import type { AuthProvider } from './auth.types.js';
import type { AuthUser } from './interfaces/AuthUser.js';
import type { UserRow } from './interfaces/UserRow.js';

const authUserColumns = ['users.id', 'users.email', 'users.name', 'users.role'] as const;

export const findUserByEmail = async (email: string): Promise<UserRow | undefined> => {
  return db<UserRow>('users')
    .select('id', 'email', 'name', 'password_hash', 'role')
    .where({ email })
    .first();
};

export const findUserByIdentity = async (provider: AuthProvider, providerUserId: string): Promise<AuthUser | undefined> => {
  return db('users')
    .join('user_identities', 'users.id', 'user_identities.user_id')
    .select<AuthUser>(...authUserColumns)
    .where({ 'user_identities.provider': provider, 'user_identities.provider_user_id': providerUserId })
    .first();
};

export const createUser = async (name: string, email: string, passwordHash: string): Promise<AuthUser> => {
  const [user] = await db('users')
    .insert({ id: randomUUID(), name, email, password_hash: passwordHash })
    .returning<AuthUser[]>(['id', 'email', 'name', 'role']);

  return user;
};

export const createUserWithIdentity = async (name: string, email: string, provider: AuthProvider, providerUserId: string): Promise<AuthUser> => {
  return db.transaction(async (transaction) => {
    const [user] = await transaction('users')
      .insert({ id: randomUUID(), name, email, password_hash: null })
      .returning<AuthUser[]>(['id', 'email', 'name', 'role']);

    await transaction('user_identities').insert({ id: randomUUID(), user_id: user.id, provider, provider_user_id: providerUserId, email });

    return user;
  });
};

export const linkUserIdentity = async (userId: string, provider: AuthProvider, providerUserId: string, email: string): Promise<void> => {
  await db('user_identities').insert({ id: randomUUID(), user_id: userId, provider, provider_user_id: providerUserId, email });
};

export const createSession = async (tokenHash: string, userId: string, expiresAt: Date): Promise<void> => {
  await db('user_sessions').insert({ token_hash: tokenHash, user_id: userId, expires_at: expiresAt });
};

export const findSessionUser = async (tokenHash: string): Promise<AuthUser | undefined> => {
  return db('user_sessions')
    .join('users', 'users.id', 'user_sessions.user_id')
    .select<AuthUser>(...authUserColumns)
    .where('user_sessions.token_hash', tokenHash)
    .andWhere('user_sessions.expires_at', '>', db.fn.now())
    .first();
};

export const deleteSession = async (tokenHash: string): Promise<void> => {
  await db('user_sessions').where({ token_hash: tokenHash }).delete();
};
