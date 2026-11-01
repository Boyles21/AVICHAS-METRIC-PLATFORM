/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Avichas Metrics Limited - Central Express Server
 * Neon Serverless Postgres with Central Data Access Layer (DAL) & Transaction-Local RLS
 */

import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  checkRateLimit,
  createSession,
  destroySession,
  emailService,
  hashPassword,
  hashToken,
  resolveSessionContext,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from './src/server/auth';
import {
  isDbConfigured,
  pool,
  queryWithIdleRetry,
  runAsSystem,
  withRequestContext,
} from './src/server/db';
import {
  DEVELOPMENT_PHASES,
  INITIAL_AUDIT_LOGS,
  INITIAL_BLOG_POSTS,
  INITIAL_COURSES,
  INITIAL_ENQUIRIES,
  INITIAL_ENROLMENTS,
  INITIAL_INVOICES,
  INITIAL_PLANS,
  INITIAL_POLICIES,
  INITIAL_SCHOOL_LICENCES,
  INITIAL_SERVICES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USERS,
} from './src/data/seedData';
import {
  AuditLogEntry,
  BlogPost,
  CustomerSubscription,
  EnquirySubmission,
  InvoiceRecord,
  LearnerEnrolment,
  SchoolLicence,
  UserProfile,
} from './src/types';

dotenv.config();

// Fallback in-memory/file storage for development when Neon DATABASE_URL is not yet configured
interface PlatformDatabase {
  users: any[];
  services: any[];
  plans: any[];
  subscriptions: any[];
  invoices: any[];
  schoolLicences: any[];
  courses: any[];
  enrolments: any[];
  blogPosts: any[];
  policies: any[];
  enquiries: any[];
  auditLogs: any[];
}

const localDb: PlatformDatabase = {
  users: [...INITIAL_USERS],
  services: [...INITIAL_SERVICES],
  plans: [...INITIAL_PLANS],
  subscriptions: [...INITIAL_SUBSCRIPTIONS],
  invoices: [...INITIAL_INVOICES],
  schoolLicences: [...INITIAL_SCHOOL_LICENCES],
  courses: [...INITIAL_COURSES],
  enrolments: [...INITIAL_ENROLMENTS],
  blogPosts: [...INITIAL_BLOG_POSTS],
  policies: [...INITIAL_POLICIES],
  enquiries: [...INITIAL_ENQUIRIES],
  auditLogs: [...INITIAL_AUDIT_LOGS],
};

// Scheduled maintenance function (Stage 1 Requirement 6)
export async function executeMaintenance(actor = 'cron_maintenance', reason = 'Scheduled expiry and publication job') {
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  if (isDbConfigured) {
    return await runAsSystem(actor, reason, async (client) => {
      // 1. Expire subscriptions past expiry_date
      const subRes = await client.query(
        `UPDATE public.subscriptions
         SET status = 'Expired', updated_at = now()
         WHERE expiry_date < CURRENT_DATE AND status = 'Active'
         RETURNING id;`
      );

      // 2. Expire licences past expiry_date
      const licRes = await client.query(
        `UPDATE public.licences
         SET status = 'Expired', updated_at = now()
         WHERE expiry_date < CURRENT_DATE AND status = 'Active'
         RETURNING id;`
      );

      // 3. Publish scheduled blog posts
      const postRes = await client.query(
        `UPDATE public.blog_posts
         SET status = 'Published', published_at = CURRENT_DATE, updated_at = now()
         WHERE status = 'Scheduled' AND scheduled_at <= now()
         RETURNING id;`
      );

      // 4. Delete expired sessions and rate limit records
      await client.query(`DELETE FROM public.sessions WHERE expires_at < now();`);
      await client.query(`DELETE FROM public.rate_limits WHERE reset_at < now();`);

      return {
        expiredSubscriptions: subRes.rowCount || 0,
        expiredLicences: licRes.rowCount || 0,
        publishedPosts: postRes.rowCount || 0,
      };
    });
  } else {
    // Local fallback
    let expiredSubs = 0;
    for (const sub of localDb.subscriptions) {
      if (sub.status === 'Active' && sub.expiryDate < todayDateStr) {
        sub.status = 'Expired';
        expiredSubs++;
      }
    }
    let expiredLics = 0;
    for (const lic of localDb.schoolLicences) {
      if (lic.status === 'Active' && lic.expiryDate < todayDateStr) {
        lic.status = 'Expired';
        expiredLics++;
      }
    }
    return {
      expiredSubscriptions: expiredSubs,
      expiredLicences: expiredLics,
      publishedPosts: 0,
    };
  }
}

export async function createApp() {
  const app = express();

  // STAGE 1 Requirement 5: Set trust proxy for Render / Cloud Run reverse proxy IP accuracy
  app.set('trust proxy', 1);

  // Security cleanup: Block direct public access to internal system files & directories
  app.use((req, res, next) => {
    const p = req.path.toLowerCase();
    if (
      p.startsWith('/docs') ||
      p.startsWith('/migrations') ||
      p.startsWith('/scripts') ||
      p.includes('.env') ||
      p.includes('.git')
    ) {
      res.status(404).send('Not Found');
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // CSRF Defence: Validate origin on state-changing requests
  app.use((req, res, next) => {
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const origin = req.headers.origin;

    // Webhooks, external licensing verification, and server-to-server endpoints (which may not have origin) are exempted
    const isExempt =
      req.path.startsWith('/api/webhooks') ||
      req.path === '/api/v1/licensing/verify' ||
      req.path === '/api/internal/maintenance';

    if (isStateChanging && !isExempt && origin) {
      const allowedAppUrl = process.env.APP_URL;
      if (allowedAppUrl) {
        try {
          const originHost = new URL(origin).host;
          const allowedHost = new URL(allowedAppUrl).host;
          if (originHost !== allowedHost && originHost !== req.headers.host) {
            res.status(403).json({ error: 'CSRF Forbidden: Origin mismatch' });
            return;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
    next();
  });

  // Health endpoint
  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({
      status: 'healthy',
      time: new Date().toISOString(),
      databaseConnected: isDbConfigured,
      trustProxy: true,
    });
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION ROUTES (Stage 1 Requirement 3)
  // --------------------------------------------------------------------------

  // POST /api/auth/signup: Rate limited per IP & per email
  app.post('/api/auth/signup', async (req, res) => {
    const clientIp = req.ip || '127.0.0.1';
    const { email, password, fullName, organisationName, phone } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, password, and full name are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    // Rate limit per IP and per email
    const ipRateOk = await checkRateLimit(`signup:ip:${clientIp}`, 10, 300);
    const emailRateOk = await checkRateLimit(`signup:email:${cleanEmail}`, 5, 300);
    if (!ipRateOk || !emailRateOk) {
      res.status(429).json({ error: 'Too many signup attempts. Please wait a few minutes.' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(verificationToken);
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const appUrl = process.env.APP_URL || `http://${req.headers.host || 'localhost:3000'}`;
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;

    if (isDbConfigured) {
      try {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Check if email already exists
          const existing = await client.query(
            `SELECT id FROM public.users WHERE email = $1;`,
            [cleanEmail]
          );
          if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(409).json({ error: 'An account with this email address already exists.' });
            return;
          }

          // Create Organisation if provided
          let orgId: string | null = null;
          if (organisationName) {
            // Row Level Security: scope this transaction to the new organisation so the
            // insert is allowed for exactly this one row and nothing else.
            const newOrgId = crypto.randomUUID();
            await client.query(`SELECT set_config('app.org_id', $1, true)`, [newOrgId]);
            await client.query(
              `INSERT INTO public.organisations (id, name) VALUES ($1, $2);`,
              [newOrgId, String(organisationName).trim()]
            );
            orgId = newOrgId;
          }

          // Create User (always role 'customer', email_verified = false)
          const userRes = await client.query(
            `INSERT INTO public.users (email, password_hash, full_name, phone, role, organisation_id, email_verified)
             VALUES ($1, $2, $3, $4, 'customer', $5, false)
             RETURNING id, email, full_name, role, organisation_id, email_verified;`,
            [cleanEmail, hashedPassword, String(fullName).trim(), phone || null, orgId]
          );
          const newUser = userRes.rows[0];

          // Store email verification token
          await client.query(
            `INSERT INTO public.email_verifications (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3);`,
            [newUser.id, tokenHash, verificationExpiry.toISOString()]
          );

          await client.query('COMMIT');

          // Send or log verification email (does not throw)
          await emailService.sendVerificationEmail(cleanEmail, verificationUrl);

          res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account before logging in.',
            userId: newUser.id,
            email: newUser.email,
          });
          return;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.error('[SIGNUP ERROR]', err.message);
        res.status(500).json({ error: 'Failed to create account. Please try again.' });
        return;
      }
    }

    // Local fallback when DB not configured
    const existing = localDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const fallbackUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      fullName: String(fullName).trim(),
      phone: phone || '',
      role: 'customer',
      organisationId: `org_${Date.now()}`,
      organisationName: organisationName || 'Independent',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    localDb.users.push(fallbackUser);
    await emailService.sendVerificationEmail(cleanEmail, verificationUrl);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email before logging in.',
      userId: fallbackUser.id,
      email: fallbackUser.email,
    });
  });

  // POST /api/auth/login: Rate limited per IP & per email
  app.post('/api/auth/login', async (req, res) => {
    const clientIp = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Rate limiting per IP and per email
    const ipRateOk = await checkRateLimit(`login:ip:${clientIp}`, 15, 300);
    const emailRateOk = await checkRateLimit(`login:email:${cleanEmail}`, 10, 300);
    if (!ipRateOk || !emailRateOk) {
      res.status(429).json({ error: 'Too many login attempts. Please wait a few minutes.' });
      return;
    }

    if (isDbConfigured) {
      try {
        const userRes = await queryWithIdleRetry(
          pool,
          `SELECT
             u.id, u.email, u.password_hash, u.full_name, u.role,
             u.organisation_id, u.email_verified, o.name AS organisation_name
           FROM public.users u
           LEFT JOIN public.organisations o ON u.organisation_id = o.id
           WHERE u.email = $1;`,
          [cleanEmail]
        );

        // Unknown email: Uniform error message
        if (userRes.rows.length === 0) {
          res.status(401).json({ error: 'Invalid email or password.' });
          return;
        }

        const user = userRes.rows[0];

        // Wrong password: Same uniform error message
        const match = await verifyPassword(password, user.password_hash);
        if (!match) {
          res.status(401).json({ error: 'Invalid email or password.' });
          return;
        }

        // Email verification check
        if (!user.email_verified) {
          res.status(403).json({
            error: 'Email verification required. Please check your inbox or click "Resend verification" to verify your email address.',
            requiresVerification: true,
            email: user.email,
          });
          return;
        }

        // Session rotation: Invalidate existing sessions for this user on new login
        await queryWithIdleRetry(
          pool,
          `DELETE FROM public.sessions WHERE user_id = $1;`,
          [user.id]
        );

        // Create new session & set HttpOnly cookie
        const sessionId = await createSession(user.id, clientIp, userAgent, res);

        res.json({
          success: true,
          sessionId, // also returned for curl / testing
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            organisationId: user.organisation_id,
            organisationName: user.organisation_name || 'Independent',
            emailVerified: true,
          },
        });
        return;
      } catch (err: any) {
        console.error('[LOGIN ERROR]', err.message);
        res.status(500).json({ error: 'Login service failed. Please try again.' });
        return;
      }
    }

    // Local fallback
    const user = localDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (user.emailVerified === false) {
      res.status(403).json({
        error: 'Email verification required. Please verify your email before logging in.',
        requiresVerification: true,
      });
      return;
    }

    res.cookie(SESSION_COOKIE_NAME, 'mock_session_123', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME),
      sameSite: 'lax',
      path: '/',
    });

    res.json({
      success: true,
      user,
    });
  });

  // POST /api/auth/logout: Destroys session from DB and clears cookie
  app.post('/api/auth/logout', async (req, res) => {
    const cookieSession = req.cookies?.[SESSION_COOKIE_NAME];
    const authHeader = req.headers.authorization;
    const bearerSession = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const sessionId = cookieSession || bearerSession;

    await destroySession(sessionId, res);
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // GET /api/auth/verify-email: Single-use token verification
  app.get('/api/auth/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      res.status(400).send('<h1>Invalid Verification Link</h1><p>Missing token.</p>');
      return;
    }

    const tokenHash = hashToken(token);

    if (isDbConfigured) {
      try {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const verifRes = await client.query(
            `SELECT id, user_id, expires_at
             FROM public.email_verifications
             WHERE token_hash = $1;`,
            [tokenHash]
          );

          if (verifRes.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(400).send('<h1>Invalid or Expired Link</h1><p>This verification link is invalid or has already been used.</p>');
            return;
          }

          const { id, user_id, expires_at } = verifRes.rows[0];
          if (new Date(expires_at) < new Date()) {
            await client.query('ROLLBACK');
            res.status(400).send('<h1>Verification Link Expired</h1><p>This verification link has expired. Please request a new one.</p>');
            return;
          }

          // Mark user as verified
          await client.query(
            `UPDATE public.users
             SET email_verified = true, email_verified_at = now(), updated_at = now()
             WHERE id = $1;`,
            [user_id]
          );

          // Invalidate single-use verification token
          await client.query(`DELETE FROM public.email_verifications WHERE id = $1;`, [id]);

          await client.query('COMMIT');

          // Return clean HTML confirmation with redirect to portal
          res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Email Verified - Avichas Metrics</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                  .card { background: #1e293b; border: 1px solid #334155; padding: 40px; border-radius: 12px; max-width: 480px; text-align: center; }
                  h1 { color: #38bdf8; font-size: 24px; margin-bottom: 12px; }
                  p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
                  a { display: inline-block; background: #0284c7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>Email Verified Successfully</h1>
                  <p>Your email has been verified. You can now sign in to your Avichas Metrics account.</p>
                  <a href="/portal">Proceed to Sign In</a>
                </div>
              </body>
            </html>
          `);
          return;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.error('[VERIFY EMAIL ERROR]', err.message);
        res.status(500).send('<h1>Verification Error</h1><p>A server error occurred. Please try again.</p>');
        return;
      }
    }

    // Local fallback
    res.send('<h1>Email Verified (Local Fallback Mode)</h1><a href="/portal">Proceed to Sign In</a>');
  });

  // POST /api/auth/forgot-password: Single-use, hashed token with 1-hour expiration
  app.post('/api/auth/forgot-password', async (req, res) => {
    const clientIp = req.ip || '127.0.0.1';
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email address is required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const rateOk = await checkRateLimit(`pwd_reset:${cleanEmail}`, 3, 300);
    if (!rateOk) {
      res.status(429).json({ error: 'Too many password reset requests. Please wait a few minutes.' });
      return;
    }

    // Always return uniform response so email presence is not leaked
    const uniformResponse = {
      success: true,
      message: 'If an account exists for this email, a password reset link has been dispatched.',
    };

    if (isDbConfigured) {
      try {
        const userRes = await queryWithIdleRetry(
          pool,
          `SELECT id, email FROM public.users WHERE email = $1;`,
          [cleanEmail]
        );

        if (userRes.rows.length > 0) {
          const user = userRes.rows[0];
          const rawToken = crypto.randomBytes(32).toString('hex');
          const tokenHash = hashToken(rawToken);
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

          await queryWithIdleRetry(
            pool,
            `INSERT INTO public.password_resets (user_id, token_hash, expires_at)
             VALUES ($1, $2, $3);`,
            [user.id, tokenHash, expiresAt.toISOString()]
          );

          const appUrl = process.env.APP_URL || `http://${req.headers.host || 'localhost:3000'}`;
          const resetUrl = `${appUrl}/#reset-password?token=${rawToken}`;
          await emailService.sendPasswordResetEmail(cleanEmail, resetUrl);
        }
      } catch (err: any) {
        console.error('[FORGOT PASSWORD ERROR]', err.message);
      }
    }

    res.json(uniformResponse);
  });

  // POST /api/auth/reset-password: Single-use check
  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required.' });
      return;
    }

    if (String(newPassword).length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const tokenHash = hashToken(String(token));

    if (isDbConfigured) {
      try {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const resetRes = await client.query(
            `SELECT id, user_id, expires_at, used_at
             FROM public.password_resets
             WHERE token_hash = $1;`,
            [tokenHash]
          );

          if (resetRes.rows.length === 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: 'Invalid or unrecognized password reset token.' });
            return;
          }

          const resetRecord = resetRes.rows[0];

          if (resetRecord.used_at !== null) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: 'This password reset link has already been used.' });
            return;
          }

          if (new Date(resetRecord.expires_at) < new Date()) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: 'This password reset link has expired. Please request a new one.' });
            return;
          }

          // Hash new password and update user
          const newHash = await hashPassword(newPassword);
          await client.query(
            `UPDATE public.users SET password_hash = $1, updated_at = now() WHERE id = $2;`,
            [newHash, resetRecord.user_id]
          );

          // Mark reset token as used (single-use guarantee)
          await client.query(
            `UPDATE public.password_resets SET used_at = now() WHERE id = $1;`,
            [resetRecord.id]
          );

          // Invalidate all active sessions for this user for security
          await client.query(
            `DELETE FROM public.sessions WHERE user_id = $1;`,
            [resetRecord.user_id]
          );

          await client.query('COMMIT');

          res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
          return;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.error('[RESET PASSWORD ERROR]', err.message);
        res.status(500).json({ error: 'Password reset failed. Please try again.' });
        return;
      }
    }

    res.json({ success: true, message: 'Password reset (local fallback).' });
  });

  // --------------------------------------------------------------------------
  // CENTRAL DATA ACCESS LAYER: PROTECTED USER & PORTAL ENDPOINTS
  // --------------------------------------------------------------------------

  // GET /api/portal/me: Strictly requires session and runs inside withRequestContext
  app.get('/api/portal/me', async (req, res) => {
    const session = await resolveSessionContext(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    if (isDbConfigured) {
      try {
        const portalData = await withRequestContext(session, async (client) => {
          // Read user profile
          const userRes = await client.query(
            `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.organisation_id, u.email_verified,
                    o.name AS organisation_name
             FROM public.users u
             LEFT JOIN public.organisations o ON u.organisation_id = o.id
             WHERE u.id = $1;`,
            [session.userId]
          );

          // Read tenant subscriptions (Filtered automatically by RLS)
          const subRes = await client.query(
            `SELECT * FROM public.subscriptions ORDER BY created_at DESC;`
          );

          // Read tenant invoices (Filtered automatically by RLS)
          const invRes = await client.query(
            `SELECT * FROM public.invoices ORDER BY issue_date DESC;`
          );

          // Read tenant school licences (Filtered automatically by RLS)
          const licRes = await client.query(
            `SELECT * FROM public.licences ORDER BY created_at DESC;`
          );

          // Read learner enrolments (Filtered automatically by RLS)
          const enrRes = await client.query(
            `SELECT * FROM public.enrolments ORDER BY enrolled_at DESC;`
          );

          return {
            profile: userRes.rows[0],
            subscriptions: subRes.rows,
            invoices: invRes.rows,
            schoolLicences: licRes.rows,
            enrolments: enrRes.rows,
          };
        });

        res.json(portalData);
        return;
      } catch (err: any) {
        console.error('[PORTAL ME ERROR]', err.message);
        res.status(500).json({ error: 'Failed to retrieve portal data.' });
        return;
      }
    }

    // Local fallback
    res.json({
      profile: localDb.users[0],
      subscriptions: localDb.subscriptions,
      invoices: localDb.invoices,
      schoolLicences: localDb.schoolLicences,
      enrolments: localDb.enrolments,
    });
  });

  // GET /api/admin/overview: Strictly requires admin/editor role
  app.get('/api/admin/overview', async (req, res) => {
    const session = await resolveSessionContext(req);
    if (!session) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!['admin', 'editor'].includes(session.role)) {
      res.status(403).json({ error: 'Forbidden: Administrator or Editor role required.' });
      return;
    }

    if (isDbConfigured) {
      try {
        const adminData = await withRequestContext(session, async (client) => {
          const isSuperAdmin = session.role === 'admin';

          const usersRes = isSuperAdmin
            ? await client.query(`SELECT id, email, full_name, role, organisation_id, email_verified, created_at FROM public.users ORDER BY created_at DESC;`)
            : { rows: [] };

          const subsRes = isSuperAdmin
            ? await client.query(`SELECT * FROM public.subscriptions ORDER BY created_at DESC;`)
            : { rows: [] };

          const licsRes = isSuperAdmin
            ? await client.query(`SELECT * FROM public.licences ORDER BY created_at DESC;`)
            : { rows: [] };

          const enqsRes = await client.query(`SELECT * FROM public.enquiries ORDER BY created_at DESC;`);

          const auditsRes = isSuperAdmin
            ? await client.query(`SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 100;`)
            : { rows: [] };

          return {
            users: usersRes.rows,
            subscriptions: subsRes.rows,
            schoolLicences: licsRes.rows,
            enquiries: enqsRes.rows,
            auditLogs: auditsRes.rows,
            callerRole: session.role,
          };
        });

        res.json(adminData);
        return;
      } catch (err: any) {
        console.error('[ADMIN OVERVIEW ERROR]', err.message);
        res.status(500).json({ error: 'Failed to retrieve administrative data.' });
        return;
      }
    }

    res.json({
      users: session.role === 'admin' ? localDb.users : [],
      subscriptions: session.role === 'admin' ? localDb.subscriptions : [],
      schoolLicences: session.role === 'admin' ? localDb.schoolLicences : [],
      enquiries: localDb.enquiries,
      auditLogs: session.role === 'admin' ? localDb.auditLogs : [],
      callerRole: session.role,
    });
  });

  // POST /api/internal/maintenance: Render cron compatible maintenance endpoint
  // Protected by CRON_SECRET header
  app.post('/api/internal/maintenance', async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret =
      req.headers['x-cron-secret'] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    if (cronSecret && providedSecret !== cronSecret) {
      res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET' });
      return;
    }

    try {
      const results = await executeMaintenance('api_maintenance', 'Render / External Cron Trigger');
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // PUBLIC WEBSITE ENDPOINTS
  // --------------------------------------------------------------------------

  // GET /api/public/bootstrap
  app.get('/api/public/bootstrap', async (_req, res) => {
    if (isDbConfigured) {
      try {
        const client = await pool.connect();
        try {
          const [servicesRes, plansRes, coursesRes, postsRes] = await Promise.all([
            client.query(`SELECT * FROM public.services ORDER BY index_number ASC;`),
            client.query(`SELECT * FROM public.plans WHERE is_active = true ORDER BY price_ngn ASC;`),
            client.query(`SELECT * FROM public.courses WHERE is_published = true ORDER BY created_at DESC;`),
            client.query(`SELECT * FROM public.blog_posts WHERE status = 'Published' ORDER BY published_at DESC;`),
          ]);

          res.json({
            services: servicesRes.rows.length > 0 ? servicesRes.rows : localDb.services,
            plans: plansRes.rows.length > 0 ? plansRes.rows : localDb.plans,
            courses: coursesRes.rows.length > 0 ? coursesRes.rows : localDb.courses,
            blogPosts: postsRes.rows.length > 0 ? postsRes.rows : localDb.blogPosts,
            policies: localDb.policies,
            databaseConfigured: true,
          });
          return;
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.error('[BOOTSTRAP ERROR]', err.message);
      }
    }

    res.json({
      services: localDb.services,
      plans: localDb.plans,
      courses: localDb.courses,
      blogPosts: localDb.blogPosts.filter((p) => p.status === 'Published'),
      policies: localDb.policies,
      databaseConfigured: false,
    });
  });

  // POST /api/enquiries: Public contact and assessment forms
  app.post('/api/enquiries', async (req, res) => {
    const clientIp = req.ip || '127.0.0.1';
    const rateLimitOk = await checkRateLimit(`enq:${clientIp}`, 10, 60);

    if (!rateLimitOk) {
      res.status(429).json({
        error: 'Too many enquiry submissions from this IP address. Please wait a moment before trying again.',
      });
      return;
    }

    const { type, fullName, organisation, email, phone, serviceInterest, message } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName || !email || !emailRegex.test(String(email)) || !message) {
      res.status(400).json({
        error: 'Validation Error: Please provide your full name, a valid corporate email address, and a message.',
      });
      return;
    }

    const newEnquiry: EnquirySubmission = {
      id: `enq-${Date.now()}`,
      type: type || 'Service Assessment',
      fullName: String(fullName).trim(),
      organisation: String(organisation || 'Independent').trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || '').trim(),
      serviceInterest: String(serviceInterest || 'General Consultation').trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
      status: 'New',
    };

    if (isDbConfigured) {
      try {
        await queryWithIdleRetry(
          pool,
          `INSERT INTO public.enquiries (type, full_name, organisation, email, phone, service_interest, message, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'New');`,
          [
            newEnquiry.type,
            newEnquiry.fullName,
            newEnquiry.organisation,
            newEnquiry.email,
            newEnquiry.phone,
            newEnquiry.serviceInterest,
            newEnquiry.message,
          ]
        );
      } catch (err: any) {
        console.error('[ENQUIRY DB ERROR]', err.message);
      }
    } else {
      localDb.enquiries.unshift(newEnquiry);
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry received and recorded successfully.',
      enquiry: newEnquiry,
    });
  });

  // POST /api/v1/licensing/verify: Real School Licensing API
  app.post('/api/v1/licensing/verify', async (req, res) => {
    const clientIp = req.ip || '127.0.0.1';
    const { licenceKey, workflowType = 'result_analysis' } = req.body;

    const rateOk = await checkRateLimit(`lic:${clientIp}:${licenceKey || 'none'}`, 30, 60);
    if (!rateOk) {
      res.status(429).json({
        decision: 'DENY',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded for licensing requests. Retry in 60 seconds.',
      });
      return;
    }

    if (!licenceKey || !licenceKey.startsWith('AVC-SCH-')) {
      res.status(401).json({
        decision: 'DENY',
        code: 'INVALID_LICENCE_FORMAT',
        message: 'A cryptographically generated Licence Key (AVC-SCH-*) is required.',
      });
      return;
    }

    if (isDbConfigured) {
      try {
        return await runAsSystem('licensing_engine', 'School Licence Verification', async (client) => {
          const licRes = await client.query(
            `SELECT l.*, s.name AS school_name
             FROM public.licences l
             JOIN public.schools s ON l.school_id = s.id
             WHERE l.licence_key = $1;`,
            [licenceKey.trim()]
          );

          if (licRes.rows.length === 0) {
            res.status(403).json({
              decision: 'DENY',
              code: 'LICENCE_NOT_FOUND',
              message: 'Licence key not recognised in central registry.',
            });
            return;
          }

          const lic = licRes.rows[0];

          if (lic.status !== 'Active') {
            res.status(403).json({
              decision: 'DENY',
              code: `LICENCE_${lic.status.toUpperCase()}`,
              message: `Licence status is currently ${lic.status}. Active subscription required.`,
            });
            return;
          }

          const now = new Date();
          if (new Date(lic.expiry_date) < now) {
            await client.query(`UPDATE public.licences SET status = 'Expired' WHERE id = $1;`, [lic.id]);
            res.status(403).json({
              decision: 'DENY',
              code: 'LICENCE_EXPIRED',
              message: `School licence expired on ${lic.expiry_date}. Please renew subscription.`,
            });
            return;
          }

          if (lic.credit_allowance - lic.credits_used < 1) {
            res.status(402).json({
              decision: 'DENY',
              code: 'CREDIT_EXHAUSTED',
              message: 'Workflow credit allowance exhausted for current term.',
            });
            return;
          }

          // Deduct credit & insert usage record
          await client.query(
            `UPDATE public.licences SET credits_used = credits_used + 1, updated_at = now() WHERE id = $1;`,
            [lic.id]
          );

          await client.query(
            `INSERT INTO public.usage_records (licence_id, school_id, organisation_id, workflow_type, credits_consumed, ip_address)
             VALUES ($1, $2, $3, $4, 1, $5);`,
            [lic.id, lic.school_id, lic.organisation_id, workflowType, clientIp]
          );

          const remainingCredits = lic.credit_allowance - (lic.credits_used + 1);
          const validUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
          const tokenSignature = crypto
            .createHmac('sha256', process.env.AUTH_SECRET || 'lic_entitlement_secret_2026')
            .update(`${lic.school_id}:${lic.licence_key}:${workflowType}:${validUntil}`)
            .digest('hex');

          res.json({
            decision: 'ALLOW',
            code: 'ENTITLEMENT_VERIFIED',
            schoolId: lic.school_id,
            schoolName: lic.school_name,
            workflowType,
            creditsDeducted: 1,
            remainingCredits,
            signedEntitlementToken: {
              token: `avc_sig_${tokenSignature.slice(0, 32)}`,
              validUntil,
              cachePolicy: 'Valid for up to 72 hours of offline execution. Expired tokens require reconnection.',
            },
          });
        });
      } catch (err: any) {
        console.error('[LICENSING ERROR]', err.message);
        res.status(500).json({ decision: 'DENY', code: 'SERVER_ERROR', message: 'Internal server error.' });
        return;
      }
    }

    // Local fallback
    const licence = localDb.schoolLicences.find((l) => l.licenceKey === licenceKey.trim());
    if (!licence) {
      res.status(403).json({ decision: 'DENY', code: 'LICENCE_NOT_FOUND', message: 'Licence key not recognised.' });
      return;
    }
    licence.creditsUsed += 1;
    res.json({
      decision: 'ALLOW',
      code: 'ENTITLEMENT_VERIFIED',
      schoolId: licence.schoolId,
      schoolName: licence.schoolName,
      workflowType,
      creditsDeducted: 1,
      remainingCredits: licence.creditAllowance - licence.creditsUsed,
      signedEntitlementToken: {
        token: `avc_sig_mock_${Date.now()}`,
        validUntil: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        cachePolicy: 'Valid for 72 hours.',
      },
    });
  });

  return app;
}
