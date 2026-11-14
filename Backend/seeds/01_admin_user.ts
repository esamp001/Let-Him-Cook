import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { defaultAdminPassword, env } from '../src/config/env.js';
import { hashPassword } from '../src/back-end-helpers/password.helpers.js';
import { emailSchema } from '../src/modules/auth/auth.schemas.js';

// Creates the admin account when it does not exist yet. An existing account with the same email is left unchanged.
export const seed = async (knex: Knex): Promise<void> => {
  if (env.nodeEnv === 'production' && env.adminPassword === defaultAdminPassword) {
    throw new Error('Set ADMIN_PASSWORD in Backend/.env before seeding the admin account in production.');
  }

  const parsedEmail = emailSchema.safeParse(env.adminEmail);

  if (!parsedEmail.success || env.adminPassword.length < 8) {
    throw new Error('ADMIN_EMAIL must be a valid email and ADMIN_PASSWORD must have at least 8 characters.');
  }

  const email = parsedEmail.data;
  const existingUser = await knex('users').select('id').where({ email }).first();

  if (existingUser) {
    console.log(`Admin seed skipped: an account already uses ${email}.`);
    return;
  }

  await knex('users').insert({
    id: randomUUID(),
    email,
    name: env.adminName,
    password_hash: await hashPassword(env.adminPassword),
    role: 'admin',
    email_verified_at: knex.fn.now(),
  });

  const passwordNote = env.adminPassword === defaultAdminPassword ? ' It uses the development default password; set ADMIN_PASSWORD in Backend/.env for any shared or live server.' : '';
  console.log(`Admin account created: ${email}.${passwordNote}`);
};
