import type { Knex } from 'knex';
import dotenv from 'dotenv';

const config: Record<string, Knex.Config> = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' },
  },
};

export default config;
