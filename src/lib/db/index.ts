import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Create postgres connection
const client = postgres(process.env.POSTGRES_URL);

// Create drizzle instance
export const db = drizzle(client);
