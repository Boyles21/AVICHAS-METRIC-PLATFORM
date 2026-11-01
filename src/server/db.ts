/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Avichas Metrics Limited - Central Data Access Layer (DAL)
 * Node-postgres (pg) Pool with Neon idle-wake retry and transaction-local RLS context
 */

import dotenv from 'dotenv';
import pg, { PoolClient, QueryResult, QueryResultRow } from 'pg';

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const isDbConfigured = Boolean(databaseUrl);

// Shared connection pool for app_user
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR]', err.message);
});

export interface UserSessionContext {
  userId: string;
  orgId: string;
  role: string;
  email?: string;
}

/**
 * Executes a query with a single automatic retry if Neon was idle / compute wake-up error occurs.
 */
export async function queryWithIdleRetry<R extends QueryResultRow = any>(
  client: PoolClient | pg.Pool,
  text: string,
  params: any[] = []
): Promise<QueryResult<R>> {
  try {
    return await client.query<R>(text, params);
  } catch (err: any) {
    const isIdleWakeError =
      err.code === 'ECONNRESET' ||
      err.code === '57P01' || // admin shutdown
      err.code === '08006' || // connection failure
      err.message?.includes('Connection terminated unexpectedly') ||
      err.message?.includes('socket has been ended') ||
      err.message?.includes('closed unexpectedly');

    if (isIdleWakeError) {
      console.warn('[NEON COMPUTE WAKE RETRY] Retrying query after idle wakeup...');
      await new Promise((r) => setTimeout(r, 500));
      return await client.query<R>(text, params);
    }
    throw err;
  }
}

/**
 * Transaction-local Request Context (Single Data Access Layer per Section 4)
 * Sets app.user_id, app.org_id, and app.role with set_config(..., true) (transaction-local).
 * Safe for transaction pooling (PgBouncer). Automatically resets on COMMIT / ROLLBACK.
 */
export async function withRequestContext<T>(
  session: UserSessionContext | null,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Transaction-local settings (is_local = true)
    await client.query(
      `SELECT
         set_config('app.user_id', $1, true),
         set_config('app.org_id', $2, true),
         set_config('app.role', $3, true);`,
      [session?.userId || '', session?.orgId || '', session?.role || '']
    );

    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // rollback error ignore
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Named, audit-logged system runner for cross-organisation maintenance or webhooks.
 * Strictly audited; no general bypass.
 */
export async function runAsSystem<T>(
  actorName: string,
  targetReason: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Set role to system
    await client.query(
      `SELECT
         set_config('app.user_id', '', true),
         set_config('app.org_id', '', true),
         set_config('app.role', 'system', true);`
    );

    const result = await fn(client);

    // Audit log recorded within the same transaction
    await client.query(
      `INSERT INTO public.audit_logs (actor_name, actor_role, action, target, ip_address)
       VALUES ($1, 'admin', 'SYSTEM_OPERATION', $2, '127.0.0.1');`,
      [actorName, targetReason]
    );

    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }
}
