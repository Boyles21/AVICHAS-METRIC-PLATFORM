/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Avichas Metrics Limited - Central Authentication & Session Management
 * Hand-rolled security module adhering strictly to Neon Postgres & Transaction Pooling RLS.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { pool, queryWithIdleRetry, UserSessionContext } from './db';

const BCRYPT_ROUNDS = 12;
export const SESSION_COOKIE_NAME = 'avichas_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory rate limiting fallback if Postgres is unavailable
const fallbackRateLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit (persistent in Postgres rate_limits table, fallback to memory)
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const now = new Date();
  const resetAtTime = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const res = await queryWithIdleRetry(
      pool,
      `SELECT count, reset_at FROM public.rate_limits WHERE id = $1;`,
      [key]
    );

    if (res.rows.length === 0) {
      await queryWithIdleRetry(
        pool,
        `INSERT INTO public.rate_limits (id, count, reset_at)
         VALUES ($1, 1, $2)
         ON CONFLICT (id) DO UPDATE SET count = public.rate_limits.count + 1;`,
        [key, resetAtTime.toISOString()]
      );
      return true;
    }

    const { count, reset_at } = res.rows[0];
    const existingReset = new Date(reset_at);

    if (existingReset < now) {
      await queryWithIdleRetry(
        pool,
        `UPDATE public.rate_limits SET count = 1, reset_at = $2 WHERE id = $1;`,
        [key, resetAtTime.toISOString()]
      );
      return true;
    }

    if (count >= maxRequests) {
      return false;
    }

    await queryWithIdleRetry(
      pool,
      `UPDATE public.rate_limits SET count = count + 1 WHERE id = $1;`,
      [key]
    );
    return true;
  } catch (err) {
    // Memory fallback
    const record = fallbackRateLimits.get(key);
    if (!record || record.resetAt < now.getTime()) {
      fallbackRateLimits.set(key, { count: 1, resetAt: now.getTime() + windowSeconds * 1000 });
      return true;
    }
    if (record.count >= maxRequests) {
      return false;
    }
    record.count += 1;
    return true;
  }
}

/**
 * Hash password with bcrypt cost factor 12
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, BCRYPT_ROUNDS);
}

/**
 * Compare plain password against hash (timing safe)
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}

/**
 * Hash token using SHA-256 for secure database lookup
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Email Service Interface
 */
export interface EmailSender {
  sendVerificationEmail(to: string, verificationUrl: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>;
}

export const emailService: EmailSender = {
  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'Avichas Metrics <no-reply@avichasmetrics.com>';

    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [to],
            subject: 'Verify your Avichas Metrics account',
            html: `
              <h2>Welcome to Avichas Metrics</h2>
              <p>Please click the link below to verify your email address:</p>
              <p><a href="${verificationUrl}" style="padding:10px 20px; background:#1e3a8a; color:#fff; text-decoration:none; border-radius:5px;">Verify Email Address</a></p>
              <p>Or paste this URL into your browser:</p>
              <p>${verificationUrl}</p>
              <p>This link expires in 1 hour.</p>
            `,
          }),
        });
        return;
      } catch (err: any) {
        console.error('[EMAIL ERROR] Failed to send email via Resend:', err.message);
      }
    }

    // Dev / Staging fallback: Print to server console so registration never crashes
    console.log('\n=============================================================');
    console.log('[EMAIL SERVICE - DEV CONSOLE LINK]');
    console.log(`To: ${to}`);
    console.log(`Action: Email Verification`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log('=============================================================\n');
  },

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'Avichas Metrics <no-reply@avichasmetrics.com>';

    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [to],
            subject: 'Reset your Avichas Metrics password',
            html: `
              <h2>Password Reset Request</h2>
              <p>We received a request to reset your Avichas Metrics account password.</p>
              <p><a href="${resetUrl}" style="padding:10px 20px; background:#1e3a8a; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a></p>
              <p>Or paste this URL into your browser:</p>
              <p>${resetUrl}</p>
              <p>This single-use link expires in 1 hour.</p>
            `,
          }),
        });
        return;
      } catch (err: any) {
        console.error('[EMAIL ERROR] Failed to send password reset via Resend:', err.message);
      }
    }

    // Dev / Staging fallback: Print to server console
    console.log('\n=============================================================');
    console.log('[EMAIL SERVICE - DEV CONSOLE LINK]');
    console.log(`To: ${to}`);
    console.log(`Action: Password Reset`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=============================================================\n');
  },
};

/**
 * Creates a database session, sets HttpOnly cookie
 */
export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string,
  res: Response
): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await queryWithIdleRetry(
    pool,
    `INSERT INTO public.sessions (id, user_id, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5);`,
    [sessionId, userId, expiresAt.toISOString(), ipAddress, userAgent]
  );

  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  return sessionId;
}

/**
 * Destroys session from database and clears cookie
 */
export async function destroySession(sessionId: string | undefined, res: Response): Promise<void> {
  if (sessionId) {
    try {
      await queryWithIdleRetry(pool, `DELETE FROM public.sessions WHERE id = $1;`, [sessionId]);
    } catch {
      // ignore
    }
  }

  res.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });
}

/**
 * Resolves current session context from cookie or Bearer header
 */
export async function resolveSessionContext(req: Request): Promise<UserSessionContext | null> {
  const cookieSession = req.cookies?.[SESSION_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  const bearerSession = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  const sessionId = cookieSession || bearerSession;
  if (!sessionId) {
    return null;
  }

  try {
    const res = await queryWithIdleRetry(
      pool,
      `SELECT
         s.id AS session_id,
         s.expires_at,
         u.id AS user_id,
         u.email,
         u.full_name,
         u.role,
         u.organisation_id,
         u.email_verified
       FROM public.sessions s
       JOIN public.users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.expires_at > now();`,
      [sessionId]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    return {
      userId: row.user_id,
      orgId: row.organisation_id || '',
      role: row.role,
      email: row.email,
    };
  } catch (err: any) {
    console.error('[AUTH CONTEXT ERROR]', err.message);
    return null;
  }
}
