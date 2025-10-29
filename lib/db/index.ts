import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/env.mjs';
import * as schema from './schema';

// Create the connection
const connectionString = env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });

// Create the database instance
export const db = drizzle(client, { schema });

// Export types for use in other files
export type Database = typeof db;
export * from './schema';
