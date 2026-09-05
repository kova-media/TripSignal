import { Pool } from 'pg';

const globalForDb = globalThis as unknown as { tripsignalPool?: Pool };

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!globalForDb.tripsignalPool) {
    globalForDb.tripsignalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
    });
  }

  return globalForDb.tripsignalPool;
}
