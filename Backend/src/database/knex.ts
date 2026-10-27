// import { knex } from 'knex';
import knex from 'knex';
import { env } from '../config/env.js';

export const db = knex({
  client: 'pg',
  connection: env.databaseUrl,
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' },
});
