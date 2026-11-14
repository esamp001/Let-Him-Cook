import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;
const passwordKeyLength = 64;

/**
 * Name: hashPassword.
 * Returns: A promise of the stored hash in the format `scrypt$<salt>$<key>`.
 * Parameters: password, the plain-text password to hash.
 * Description: Hashes a password with Node's built-in scrypt and a random salt so plain passwords are never stored.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, passwordKeyLength);

  return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
};

/**
 * Name: verifyPassword.
 * Returns: A promise of true when the password matches the stored hash, otherwise false.
 * Parameters: password, the plain-text password to check; passwordHash, the stored hash from hashPassword.
 * Description: Re-derives the scrypt key with the stored salt and compares it in constant time.
 */
export const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
  const [algorithm, salt, key] = passwordHash.split('$');

  if (algorithm !== 'scrypt' || !salt || !key) return false;

  const expectedKey = Buffer.from(key, 'base64url');
  const derivedKey = await scryptAsync(password, Buffer.from(salt, 'base64url'), expectedKey.length);

  return timingSafeEqual(derivedKey, expectedKey);
};
