/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Neon Postgres Backup Script (npm run backup)
 * Generates point-in-time SQL dump file using pg_dump
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const dbUrl = process.env.DATABASE_URL_MIGRATE || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL_MIGRATE or DATABASE_URL is not set.');
  process.exit(1);
}

const backupDir = path.resolve(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `avichas-backup-${timestamp}.sql`);

console.log('--- Avichas Metrics Database Backup ---');
console.log(`Target file: ${backupFile}`);

try {
  // Execute pg_dump
  execSync(`pg_dump "${dbUrl}" --clean --if-exists --no-owner --no-privileges -f "${backupFile}"`, {
    stdio: 'inherit',
  });
  console.log(`[SUCCESS] Backup saved to ${backupFile}`);
} catch (err: any) {
  console.error('[NOTICE] System pg_dump CLI utility failed or not installed in current shell environment.');
  console.log('You can execute the backup directly from any system with PostgreSQL client tools using:');
  console.log(`pg_dump "${dbUrl}" --clean --if-exists -f "${backupFile}"`);
}
