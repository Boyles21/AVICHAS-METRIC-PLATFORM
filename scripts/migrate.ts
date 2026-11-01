/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Neon Postgres Migration Runner (npm run migrate)
 * Connects via DATABASE_URL_MIGRATE (Owner Direct Connection)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const rawConnectionString = process.env.DATABASE_URL_MIGRATE || process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error('DATABASE_URL_MIGRATE or DATABASE_URL is not set.');
  console.error('Please configure your Neon direct owner connection string in .env:');
  console.error('DATABASE_URL_MIGRATE=postgresql://neondb_owner:PASSWORD@ep-xy.us-east-2.aws.neon.tech/neondb?sslmode=require');
  process.exit(1);
}

const connectionString: string = rawConnectionString;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function runMigrations() {
  console.log('--- Avichas Metrics Database Migrations ---');
  console.log(`Connecting to: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const client = await pool.connect();
  try {
    // 1. Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 2. Read already applied migrations
    const { rows: appliedRows } = await client.query(`
      SELECT name FROM public.schema_migrations ORDER BY id ASC;
    `);
    const appliedSet = new Set(appliedRows.map((r: { name: string }) => r.name));

    // 3. Scan /migrations folder
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found at ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  [OK] ${file} (already applied)`);
        continue;
      }

      console.log(`  [>>] Applying ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO public.schema_migrations (name) VALUES ($1);',
          [file]
        );
        await client.query('COMMIT');
        console.log(`  [OK] ${file} applied successfully.`);
        appliedCount++;
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`  [FAIL] Failed executing migration ${file}:`, err.message);
        throw err;
      }
    }

    console.log(`--- Migration complete. ${appliedCount} new migration(s) applied. ---`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
