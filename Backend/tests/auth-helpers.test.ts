import assert from 'node:assert/strict';
import test from 'node:test';
import { createSecretToken, getSessionCookieOptions, getSessionExpiresAt, hashSecretToken } from '../src/back-end-helpers/auth-session.helpers.js';
import { getSafeRedirectPath } from '../src/back-end-helpers/auth-redirect.helpers.js';
import { hashPassword, verifyPassword } from '../src/back-end-helpers/password.helpers.js';
import { signInRequestSchema, signUpRequestSchema } from '../src/modules/auth/auth.schemas.js';

test('password hashes verify only the original password and never contain it', async () => {
  const passwordHash = await hashPassword('adobo-secret-123');

  assert.ok(passwordHash.startsWith('scrypt$'));
  assert.ok(!passwordHash.includes('adobo-secret-123'));
  assert.equal(await verifyPassword('adobo-secret-123', passwordHash), true);
  assert.equal(await verifyPassword('wrong-password', passwordHash), false);
  assert.equal(await verifyPassword('adobo-secret-123', 'not-a-valid-hash'), false);
});

test('the same password hashes differently each time because of the random salt', async () => {
  assert.notEqual(await hashPassword('same-password'), await hashPassword('same-password'));
});

test('session tokens are random and stored only as a SHA-256 hash', () => {
  const sessionToken = createSecretToken();

  assert.notEqual(sessionToken, createSecretToken());
  assert.match(hashSecretToken(sessionToken), /^[a-f0-9]{64}$/);
  assert.equal(hashSecretToken(sessionToken), hashSecretToken(sessionToken));
});

test('keep signed in sets a 30-day cookie, otherwise the cookie ends with the browser session', () => {
  assert.equal(getSessionCookieOptions(true).maxAge, 30 * 24 * 60 * 60 * 1_000);
  assert.equal(getSessionCookieOptions(false).maxAge, undefined);
  assert.equal(getSessionCookieOptions(false).httpOnly, true);
  assert.ok(getSessionExpiresAt(true).getTime() > getSessionExpiresAt(false).getTime());
});

test('auth request schemas normalize email and enforce password length', () => {
  assert.equal(signInRequestSchema.parse({ email: '  Juan@Example.COM ', password: 'x' }).email, 'juan@example.com');
  assert.equal(signInRequestSchema.parse({ email: 'juan@example.com', password: 'x' }).keepSignedIn, false);
  assert.equal(signUpRequestSchema.safeParse({ name: 'Juan', email: 'juan@example.com', password: 'short' }).success, false);
});

test('sign-in redirects only allow same-site paths', () => {
  assert.equal(getSafeRedirectPath('/My-Recipes'), '/My-Recipes');
  assert.equal(getSafeRedirectPath('/Recipes?search=adobo'), '/Recipes?search=adobo');
  assert.equal(getSafeRedirectPath(undefined), '/Home');
  assert.equal(getSafeRedirectPath('https://evil.example'), '/Home');
  assert.equal(getSafeRedirectPath('//evil.example'), '/Home');
  assert.equal(getSafeRedirectPath('/\\evil.example'), '/Home');
  assert.equal(getSafeRedirectPath('/Login?redirect=/Home'), '/Home');
});
