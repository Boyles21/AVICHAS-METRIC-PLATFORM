/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * CLI Admin Creation Script (npm run create-admin -- you@email.com [password])
 * Admin accounts are provisioned exclusively via CLI or direct database query, never through the web UI.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const emailArg = process.argv[2];
const passwordArg = process.argv[3];

if (!emailArg || !emailArg.includes('@')) {
  console.error('Usage: npm run create-admin -- <email> [optional_initial_password]');
  console.error('Example: npm run create-admin -- admin@avichasmetrics.com SuperSecurePass123!');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const rawPassword = passwordArg || crypto.randomBytes(12).toString('hex') + 'Aa1!';

const rawConnectionString = process.env.DATABASE_URL_MIGRATE || process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error('DATABASE_URL_MIGRATE or DATABASE_URL not set in environment.');
  process.exit(1);
}

const connectionString: string = rawConnectionString;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function createAdmin() {
  const client = await pool.connect();
  try {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 1. Ensure Avichas HQ organisation exists
    const { rows: orgRows } = await client.query(
      `INSERT INTO public.organisations (name, cac_number)
       VALUES ('Avichas Metrics Limited', '9880947')
       ON CONFLICT DO NOTHING
       RETURNING id;`
    );

    let orgId = orgRows[0]?.id;
    if (!orgId) {
      const { rows } = await client.query(`SELECT id FROM public.organisations WHERE name = 'Avichas Metrics Limited' LIMIT 1;`);
      orgId = rows[0]?.id;
    }

    // 2. Insert or update user with admin role and verified status
    const { rows: userRows } = await client.query(
      `INSERT INTO public.users (email, password_hash, full_name, role, organisation_id, email_verified, email_verified_at)
       VALUES ($1, $2, 'Avichas Administrator', 'admin', $3, true, now())
       ON CONFLICT (email) DO UPDATE
       SET role = 'admin',
           password_hash = $2,
           email_verified = true,
           updated_at = now()
       RETURNING id, email, role;`,
      [email, passwordHash, orgId]
    );

    console.log('====================================================');
    console.log('ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('====================================================');
    console.log(`User ID:  ${userRows[0].id}`);
    console.log(`Email:    ${userRows[0].email}`);
    console.log(`Role:     ${userRows[0].role.toUpperCase()}`);
    console.log(`Password: ${rawPassword}`);
    console.log('====================================================');
    console.log('Store this password securely. It will not be shown again.');
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin().catch((err) => {
  console.error('Fatal admin creation failure:', err);
  process.exit(1);
});
