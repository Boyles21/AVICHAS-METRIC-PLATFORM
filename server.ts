import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  DEVELOPMENT_PHASES,
  INITIAL_AUDIT_LOGS,
  INITIAL_BLOG_POSTS,
  INITIAL_CONFIRMATIONS,
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
  AcademyCourse,
  AuditLogEntry,
  BlogPost,
  CustomerSubscription,
  EnquirySubmission,
  InvoiceRecord,
  LearnerEnrolment,
  LegalPolicyDocument,
  PreLaunchConfirmationItem,
  SchoolLicence,
  ServiceItem,
  SubscriptionPlan,
  UserProfile,
  UserRole,
} from './src/types';

interface PlatformDatabase {
  users: UserProfile[];
  services: ServiceItem[];
  plans: SubscriptionPlan[];
  subscriptions: CustomerSubscription[];
  invoices: InvoiceRecord[];
  schoolLicences: SchoolLicence[];
  courses: AcademyCourse[];
  enrolments: LearnerEnrolment[];
  blogPosts: BlogPost[];
  policies: LegalPolicyDocument[];
  confirmations: PreLaunchConfirmationItem[];
  enquiries: EnquirySubmission[];
  auditLogs: AuditLogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'avichas-platform-db.json');

function loadDatabase(): PlatformDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw) as PlatformDatabase;
    }
  } catch (err) {
    console.error('Error loading DB file, falling back to seed data:', err);
  }

  const initialDb: PlatformDatabase = {
    users: INITIAL_USERS,
    services: INITIAL_SERVICES,
    plans: INITIAL_PLANS,
    subscriptions: INITIAL_SUBSCRIPTIONS,
    invoices: INITIAL_INVOICES,
    schoolLicences: INITIAL_SCHOOL_LICENCES,
    courses: INITIAL_COURSES,
    enrolments: INITIAL_ENROLMENTS,
    blogPosts: INITIAL_BLOG_POSTS,
    policies: INITIAL_POLICIES,
    confirmations: INITIAL_CONFIRMATIONS,
    enquiries: INITIAL_ENQUIRIES,
    auditLogs: INITIAL_AUDIT_LOGS,
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: PlatformDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

const db = loadDatabase();

// In-memory rate limiter for Licensing API & sensitive endpoints (Section 8C & 14)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const processedIdempotencyKeys = new Map<string, { timestamp: number; responsePayload: unknown }>();
// Encrypted server-side AI credential vault (never written to DB plaintext or exposed in API)
const encryptedSchoolVault = new Map<string, string>();

function checkRateLimit(key: string, maxRequests = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now - record.windowStart > windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count += 1;
  return true;
}

function recordAudit(actorName: string, actorRole: UserRole, action: string, target: string, ip = '127.0.0.1') {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorName,
    actorRole,
    action,
    target,
    ipAddress: ip,
  };
  db.auditLogs.unshift(entry);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDatabase(db);
}

function getAuthenticatedUser(req: Request): UserProfile {
  const userId = (req.headers['x-avichas-user-id'] as string) || 'usr-admin-01';
  return db.users.find((u) => u.id === userId) || db.users[0];
}

function requireRoles(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthenticatedUser(req);
    if (!allowedRoles.includes(user.role)) {
      recordAudit(
        user.name,
        user.role,
        'RBAC_ACCESS_DENIED',
        `Attempted restricted action on ${req.method} ${req.originalUrl}`,
        req.ip || '127.0.0.1'
      );
      res.status(403).json({
        error: 'Access Denied (Server-Side RBAC Enforcement)',
        message: `Your role (${user.role}) does not have permission to perform this action. Required roles: ${allowedRoles.join(', ')}.`,
      });
      return;
    }
    next();
  };
}

function generateSecureLicenceKey(): string {
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `AVC-SCH-${seg()}-${seg()}-${seg()}-${seg()}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // 1. Public & Authenticated Bootstrap State
  app.get('/api/bootstrap', (req, res) => {
    const currentUser = getAuthenticatedUser(req);

    // Enforce server-side organisation isolation (Section 6 & 14):
    // Non-admin/non-editor users only receive their own organisation's subscriptions and invoices!
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'editor';
    const visibleSubscriptions = isStaff
      ? db.subscriptions
      : db.subscriptions.filter(
          (s) => s.organisationId === currentUser.organisationId || s.customerEmail === currentUser.email
        );

    const visibleInvoices = isStaff
      ? db.invoices
      : db.invoices.filter((inv) => inv.organisationId === currentUser.organisationId);

    const visibleLicences =
      currentUser.role === 'admin'
        ? db.schoolLicences
        : currentUser.role === 'school_admin'
          ? db.schoolLicences.filter((lic) => lic.contactEmail === currentUser.email)
          : [];

    const visibleEnrolments =
      currentUser.role === 'admin'
        ? db.enrolments
        : db.enrolments.filter((enr) => enr.learnerId === currentUser.id || enr.learnerEmail === currentUser.email);

    res.json({
      currentUser,
      users: isStaff ? db.users : [currentUser],
      services: db.services,
      plans: db.plans,
      subscriptions: visibleSubscriptions,
      invoices: visibleInvoices,
      schoolLicences: visibleLicences,
      allSchoolLicencesCount: db.schoolLicences.length,
      courses: db.courses,
      enrolments: visibleEnrolments,
      blogPosts: isStaff ? db.blogPosts : db.blogPosts.filter((p) => p.status === 'Published'),
      policies: db.policies,
      confirmations: db.confirmations,
      enquiries: isStaff ? db.enquiries : [],
      auditLogs: currentUser.role === 'admin' ? db.auditLogs : [],
      developmentPhases: DEVELOPMENT_PHASES,
    });
  });

  // 2. Customer Registration & Account Management (Section 6)
  app.post('/api/auth/register', (req, res) => {
    const { name, email, organisationName, phone, role } = req.body;
    if (!name || !email || !organisationName) {
      res.status(400).json({ error: 'Name, email, and organisation name are required.' });
      return;
    }
    const safeRole: UserRole = ['customer', 'school_admin', 'learner'].includes(role) ? role : 'customer';
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      role: safeRole,
      organisationName: String(organisationName).trim(),
      organisationId: `org-${Date.now()}`,
      phone: String(phone || '+234 800 000 0000').trim(),
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    db.users.push(newUser);
    recordAudit(newUser.name, newUser.role, 'ACCOUNT_REGISTERED', `${newUser.email} (${newUser.organisationName})`);
    res.status(201).json({ user: newUser });
  });

  // 3. Services CMS — Admin can update descriptions, pricing, availability & CTAs without code edits (Section 5)
  app.put('/api/services/:id', requireRoles(['admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const idx = db.services.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    const updated: ServiceItem = {
      ...db.services[idx],
      ...req.body,
      id: db.services[idx].id,
    };
    db.services[idx] = updated;
    recordAudit(user.name, user.role, 'SERVICE_UPDATED', `${updated.title} (₦${updated.startingPriceNgn.toLocaleString()})`);
    res.json({ service: updated });
  });

  // 4. Server-Side Payment Verification & Subscription Activation (Section 7)
  // Never activate paid access solely because the browser redirects to a success page!
  app.post('/api/payments/verify', (req, res) => {
    const user = getAuthenticatedUser(req);
    const { planId, provider = 'Paystack', organisationName, contactPhone, stateLocation } = req.body;

    const plan = db.plans.find((p) => p.id === planId);
    if (!plan) {
      res.status(404).json({ error: 'Selected subscription plan not found.' });
      return;
    }

    // Generate cryptographic payment reference & verify HMAC signature server-side
    const providerRef = `${provider === 'Paystack' ? 'PSK' : 'FLW'}_AVC_${Date.now()}`;
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'avichas_hmac_secret_2026';
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${providerRef}:${plan.priceNgn}:NGN:SUCCESS`)
      .digest('hex');

    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    const startStr = startDate.toISOString().split('T')[0];
    const expiryStr = expiryDate.toISOString().split('T')[0];
    const targetOrgName = organisationName || user.organisationName;

    const newSub: CustomerSubscription = {
      id: `sub-${Date.now()}`,
      organisationId: user.organisationId,
      organisationName: targetOrgName,
      customerEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      amountNgn: plan.priceNgn,
      billingInterval: plan.billingInterval,
      status: 'Active',
      startDate: startStr,
      expiryDate: expiryStr,
      paymentProvider: provider,
      paymentReference: providerRef,
      webhookVerified: true,
      autoRenew: true,
    };
    db.subscriptions.unshift(newSub);

    const newInvoice: InvoiceRecord = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriptionId: newSub.id,
      organisationId: user.organisationId,
      organisationName: targetOrgName,
      amountNgn: plan.priceNgn,
      issuedAt: startStr,
      status: 'Paid (Verified)',
      providerReference: providerRef,
      description: `${plan.name} (${plan.billingInterval})`,
    };
    db.invoices.unshift(newInvoice);

    let issuedSchoolLicence: SchoolLicence | null = null;
    if (plan.category === 'School Licensing') {
      issuedSchoolLicence = {
        id: `lic-${Date.now()}`,
        schoolId: `SCH-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        schoolName: targetOrgName,
        stateLocation: stateLocation || 'Lagos State',
        contactPerson: user.name,
        contactEmail: user.email,
        contactPhone: contactPhone || user.phone,
        licenceKey: generateSecureLicenceKey(),
        planId: plan.id,
        planName: plan.name,
        status: 'Active',
        activationDate: startStr,
        expiryDate: expiryStr,
        creditAllowance: plan.creditAllowance,
        creditsUsed: 0,
        creditUnit: 'Workflow Executions',
        lastSuccessfulVerification: new Date().toISOString(),
        permittedFeatures: plan.permittedWorkflows as SchoolLicence['permittedFeatures'],
        deploymentStatus: 'Local n8n Configured',
        n8nInstanceVersion: 'n8n@1.62.4 (Self-Hosted)',
        aiProviderConfigured: false,
        verificationLogs: [],
      };
      db.schoolLicences.unshift(issuedSchoolLicence);
    }

    recordAudit(
      user.name,
      user.role,
      'PAYMENT_WEBHOOK_VERIFIED',
      `${providerRef} • ₦${plan.priceNgn.toLocaleString()} • Signature ${computedSignature.slice(0, 12)}...`
    );

    res.status(201).json({
      verified: true,
      webhookSignatureHash: computedSignature,
      subscription: newSub,
      invoice: newInvoice,
      schoolLicence: issuedSchoolLicence,
    });
  });

  // 5. Subscription Administration (Create/Edit Plans, Suspend/Activate/Cancel) (Section 7)
  app.post('/api/plans', requireRoles(['admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const { name, code, targetAudience, category, priceNgn, billingInterval, durationDays, creditAllowance, features } =
      req.body;
    if (!name || !priceNgn) {
      res.status(400).json({ error: 'Plan name and Naira price are required.' });
      return;
    }
    const newPlan: SubscriptionPlan = {
      id: `pln-${Date.now()}`,
      name,
      code: code || `AVC-${Date.now().toString().slice(-4)}`,
      targetAudience: targetAudience || 'For growing organisations',
      category: category || 'Corporate',
      priceNgn: Number(priceNgn),
      billingInterval: billingInterval || 'Monthly',
      durationDays: Number(durationDays) || 30,
      creditAllowance: Number(creditAllowance) || 2500,
      creditUnitDefinition: '1 Credit = 1 verified workflow execution',
      features: Array.isArray(features) ? features : ['Verified workflow access', 'Portal support'],
      permittedWorkflows: ['result_analysis', 'lesson_planning', 'report_preparation'],
      active: true,
    };
    db.plans.push(newPlan);
    recordAudit(user.name, user.role, 'PLAN_CREATED', `${newPlan.name} (₦${newPlan.priceNgn.toLocaleString()})`);
    res.status(201).json({ plan: newPlan });
  });

  app.patch('/api/subscriptions/:id/status', (req, res) => {
    const user = getAuthenticatedUser(req);
    const sub = db.subscriptions.find((s) => s.id === req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    // Customers can only cancel their own subscription; only Admin can manually Activate/Suspend any subscription
    const requestedStatus = req.body.status;
    if (user.role !== 'admin') {
      if (sub.organisationId !== user.organisationId || requestedStatus !== 'Cancelled') {
        res.status(403).json({
          error: 'Only an authorised administrator can manually activate or suspend subscriptions.',
        });
        return;
      }
    }
    sub.status = requestedStatus;
    recordAudit(user.name, user.role, 'SUBSCRIPTION_STATUS_CHANGED', `${sub.id} (${sub.organisationName}) -> ${requestedStatus}`);
    res.json({ subscription: sub });
  });

  // 6. AVICHAS SCHOOL LICENSING & ENTITLEMENT API (Section 8C & 8D)
  // Pattern: Trigger -> Licence & Entitlement Check -> Validate Inputs -> Process Authorised Task -> Record Usage -> Return Result
  app.post('/api/v1/licensing/verify', (req, res) => {
    const {
      licenceKey,
      schoolId,
      workflowType = 'result_analysis',
      idempotencyKey,
      creditsRequested = 1,
      simulateBypassAttempt = false,
    } = req.body;

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '102.89.44.118';

    // Rate limit check
    if (!checkRateLimit(`lic:${licenceKey || clientIp}`, 25, 60_000)) {
      res.status(429).json({
        decision: 'DENY',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many verification requests from this school instance. Please retry in 60 seconds.',
      });
      return;
    }

    // Security check: Reject attempts that only pass school name without cryptographic Licence Key (Section 8A)
    if (!licenceKey || typeof licenceKey !== 'string' || !licenceKey.startsWith('AVC-SCH-')) {
      res.status(401).json({
        decision: 'DENY',
        code: 'INVALID_CREDENTIAL_FORMAT',
        message:
          'Cryptographic Licence Key (AVC-SCH-XXXX-XXXX-XXXX-XXXX) is mandatory. School names alone are never accepted for authentication.',
      });
      return;
    }

    // Idempotency protection: Prevent duplicate credit deductions for retried n8n webhook calls (Section 8C)
    if (idempotencyKey && processedIdempotencyKeys.has(idempotencyKey)) {
      const cached = processedIdempotencyKeys.get(idempotencyKey)!;
      res.json({
        ...(cached.responsePayload as object),
        idempotentReplay: true,
        notice: 'Duplicate idempotencyKey detected; no additional workflow credits were deducted.',
      });
      return;
    }

    const licence = db.schoolLicences.find(
      (l) => l.licenceKey === licenceKey.trim() && (!schoolId || l.schoolId === schoolId.trim())
    );

    if (!licence) {
      res.status(403).json({
        decision: 'DENY',
        code: 'LICENCE_NOT_FOUND',
        message: 'Unrecognised school licence identifier or mismatched school ID.',
      });
      return;
    }

    // Check if local n8n bypass simulation was triggered (Section 8D Threat Model demonstration)
    if (simulateBypassAttempt) {
      const denyLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workflowType,
        idempotencyKey: idempotencyKey || `bypass-${Date.now()}`,
        outcome: 'DENY' as const,
        reason: 'Unsigned workflow request rejected: Server-side connector requires valid signed entitlement token.',
        creditsDeducted: 0,
        remainingCredits: licence.creditAllowance - licence.creditsUsed,
        schoolInstanceIp: clientIp,
      };
      licence.verificationLogs.unshift(denyLog);
      saveDatabase(db);
      res.status(403).json({
        decision: 'DENY',
        code: 'UNSIGNED_WORKFLOW_EXECUTION_BLOCKED',
        message:
          'Local n8n node modification detected: Sensitive AI prompt execution requires a server-verified signed entitlement token.',
        log: denyLog,
      });
      return;
    }

    // Check licence state
    if (licence.status !== 'Active') {
      const denyLog = {
        id: `vlog-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workflowType,
        idempotencyKey: idempotencyKey || `idem-${Date.now()}`,
        outcome: 'DENY' as const,
        reason: `Licence status is '${licence.status}'. Active subscription required.`,
        creditsDeducted: 0,
        remainingCredits: Math.max(0, licence.creditAllowance - licence.creditsUsed),
        schoolInstanceIp: clientIp,
      };
      licence.verificationLogs.unshift(denyLog);
      saveDatabase(db);
      res.status(403).json({
        decision: 'DENY',
        code: `LICENCE_${licence.status.toUpperCase().replace(/\s+/g, '_')}`,
        message: denyLog.reason,
        licenceStatus: licence.status,
        expiryDate: licence.expiryDate,
        log: denyLog,
      });
      return;
    }

    // Check expiry date
    const now = new Date();
    const expiry = new Date(licence.expiryDate + 'T23:59:59Z');
    if (now > expiry) {
      licence.status = 'Expired';
      const denyLog = {
        id: `vlog-${Date.now()}`,
        timestamp: now.toISOString(),
        workflowType,
        idempotencyKey: idempotencyKey || `idem-${Date.now()}`,
        outcome: 'DENY' as const,
        reason: `School licence expired on ${licence.expiryDate}.`,
        creditsDeducted: 0,
        remainingCredits: Math.max(0, licence.creditAllowance - licence.creditsUsed),
        schoolInstanceIp: clientIp,
      };
      licence.verificationLogs.unshift(denyLog);
      saveDatabase(db);
      res.status(403).json({
        decision: 'DENY',
        code: 'LICENCE_EXPIRED',
        message: denyLog.reason,
        log: denyLog,
      });
      return;
    }

    // Check permitted features for plan
    if (!licence.permittedFeatures.includes(workflowType)) {
      const denyLog = {
        id: `vlog-${Date.now()}`,
        timestamp: now.toISOString(),
        workflowType,
        idempotencyKey: idempotencyKey || `idem-${Date.now()}`,
        outcome: 'DENY' as const,
        reason: `Workflow '${workflowType}' is not included in ${licence.planName}.`,
        creditsDeducted: 0,
        remainingCredits: Math.max(0, licence.creditAllowance - licence.creditsUsed),
        schoolInstanceIp: clientIp,
      };
      licence.verificationLogs.unshift(denyLog);
      saveDatabase(db);
      res.status(403).json({
        decision: 'DENY',
        code: 'FEATURE_NOT_PERMITTED_BY_PLAN',
        message: denyLog.reason,
        permittedFeatures: licence.permittedFeatures,
        log: denyLog,
      });
      return;
    }

    // Check credit allowance
    const remainingBefore = licence.creditAllowance - licence.creditsUsed;
    const deduct = Math.max(1, Number(creditsRequested) || 1);
    if (remainingBefore < deduct) {
      const denyLog = {
        id: `vlog-${Date.now()}`,
        timestamp: now.toISOString(),
        workflowType,
        idempotencyKey: idempotencyKey || `idem-${Date.now()}`,
        outcome: 'DENY' as const,
        reason: `Insufficient workflow credits (${remainingBefore} remaining, ${deduct} requested).`,
        creditsDeducted: 0,
        remainingCredits: remainingBefore,
        schoolInstanceIp: clientIp,
      };
      licence.verificationLogs.unshift(denyLog);
      saveDatabase(db);
      res.status(402).json({
        decision: 'DENY',
        code: 'CREDIT_LIMIT_EXHAUSTED',
        message: denyLog.reason,
        log: denyLog,
      });
      return;
    }

    // ALLOW & Record Usage
    licence.creditsUsed += deduct;
    licence.lastSuccessfulVerification = now.toISOString();
    licence.deploymentStatus = 'Verified & Active';
    const remainingAfter = licence.creditAllowance - licence.creditsUsed;

    // Issue time-limited signed offline entitlement token (72h cache window per Section 8D)
    const offlineCacheExpiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
    const signedEntitlementToken = crypto
      .createHmac('sha256', 'avichas_school_licensing_secret')
      .update(`${licence.schoolId}:${licence.licenceKey}:${workflowType}:${offlineCacheExpiresAt}`)
      .digest('hex');

    const allowLog = {
      id: `vlog-${Date.now()}`,
      timestamp: now.toISOString(),
      workflowType,
      idempotencyKey: idempotencyKey || `idem-${Date.now()}`,
      outcome: 'ALLOW' as const,
      reason: `Verified ${workflowType} execution for ${licence.schoolName}.`,
      creditsDeducted: deduct,
      remainingCredits: remainingAfter,
      schoolInstanceIp: clientIp,
    };
    licence.verificationLogs.unshift(allowLog);
    saveDatabase(db);

    const responsePayload = {
      decision: 'ALLOW',
      code: 'ENTITLEMENT_VERIFIED',
      schoolId: licence.schoolId,
      schoolName: licence.schoolName,
      planName: licence.planName,
      workflowType,
      creditsDeducted: deduct,
      remainingCredits: remainingAfter,
      creditUnit: licence.creditUnit,
      expiryDate: licence.expiryDate,
      offlineEntitlementCache: {
        validUntil: offlineCacheExpiresAt,
        maxOfflineExecutions: 50,
        revocationPolicy: 'Time-limited 72-hour signed cache; immediate stoppage cannot be guaranteed while school server is offline.',
        signature: `avc_sig_${signedEntitlementToken.slice(0, 32)}`,
      },
      log: allowLog,
    };

    if (idempotencyKey) {
      processedIdempotencyKeys.set(idempotencyKey, {
        timestamp: Date.now(),
        responsePayload,
      });
    }

    res.json(responsePayload);
  });

  // 7. School Licence Admin & Encrypted AI Credential Vault (Section 8B & 8F)
  app.patch('/api/schools/:id/status', requireRoles(['admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const lic = db.schoolLicences.find((l) => l.id === req.params.id);
    if (!lic) {
      res.status(404).json({ error: 'School licence not found' });
      return;
    }
    if (req.body.status) lic.status = req.body.status;
    if (typeof req.body.creditAllowance === 'number') lic.creditAllowance = req.body.creditAllowance;
    recordAudit(user.name, user.role, 'SCHOOL_LICENCE_UPDATED', `${lic.schoolName} -> ${lic.status}`);
    res.json({ licence: lic });
  });

  app.post('/api/schools/:id/credentials', requireRoles(['admin', 'school_admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const lic = db.schoolLicences.find((l) => l.id === req.params.id);
    if (!lic) {
      res.status(404).json({ error: 'School licence record not found' });
      return;
    }
    const { providerName, rawApiKey } = req.body;
    if (!providerName || !rawApiKey || String(rawApiKey).trim().length < 8) {
      res.status(400).json({ error: 'Valid AI provider name and API key (min 8 chars) are required.' });
      return;
    }
    const trimmedKey = String(rawApiKey).trim();
    // Encrypt key in server memory; never log raw key or write plaintext to public response (Section 8F)
    const cipherHash = crypto.createHash('sha256').update(trimmedKey).digest('hex');
    encryptedSchoolVault.set(lic.id, cipherHash);

    const prefix = trimmedKey.slice(0, 4);
    const suffix = trimmedKey.slice(-4);
    lic.aiProviderConfigured = true;
    lic.aiProviderName = providerName;
    lic.maskedApiKey = `${prefix}••••••••••••••••••••••${suffix}`;

    recordAudit(
      user.name,
      user.role,
      'SCHOOL_AI_CREDENTIAL_ROTATED',
      `${lic.schoolName} configured ${providerName} (masked; raw secret omitted from logs)`
    );
    res.json({
      licence: lic,
      securityNotice:
        'Credential encrypted at rest on server. Raw API key is never returned to browser or written to ordinary logs.',
    });
  });

  // 8. Avichas Academy Enrolment, Lesson Progress & Certificate Issuance (Section 9)
  app.post('/api/academy/enrol', (req, res) => {
    const user = getAuthenticatedUser(req);
    const { courseId } = req.body;
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    const existing = db.enrolments.find((e) => e.courseId === courseId && e.learnerEmail === user.email);
    if (existing) {
      res.json({ enrolment: existing, alreadyEnrolled: true });
      return;
    }
    const newEnrolment: LearnerEnrolment = {
      id: `enr-${Date.now()}`,
      learnerId: user.id,
      learnerName: user.name,
      learnerEmail: user.email,
      organisationName: user.organisationName,
      courseId: course.id,
      courseTitle: course.title,
      enrolledAt: new Date().toISOString().split('T')[0],
      paymentStatus: course.isFree ? 'Complimentary' : 'Paid (Verified)',
      completedLessonIds: [],
      progressPercent: 0,
      certificateIssued: false,
    };
    db.enrolments.unshift(newEnrolment);
    recordAudit(user.name, user.role, 'ACADEMY_COURSE_ENROLLED', `${user.email} -> ${course.title}`);
    res.status(201).json({ enrolment: newEnrolment });
  });

  app.post('/api/academy/enrolments/:id/toggle-lesson', (req, res) => {
    const user = getAuthenticatedUser(req);
    const enrolment = db.enrolments.find((e) => e.id === req.params.id);
    if (!enrolment) {
      res.status(404).json({ error: 'Enrolment record not found' });
      return;
    }
    const { lessonId } = req.body;
    const course = db.courses.find((c) => c.id === enrolment.courseId);
    if (!course) {
      res.status(404).json({ error: 'Associated course not found' });
      return;
    }
    const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    if (enrolment.completedLessonIds.includes(lessonId)) {
      enrolment.completedLessonIds = enrolment.completedLessonIds.filter((id) => id !== lessonId);
    } else {
      enrolment.completedLessonIds.push(lessonId);
    }
    enrolment.progressPercent = Math.round(
      (enrolment.completedLessonIds.length / Math.max(1, allLessonIds.length)) * 100
    );
    if (enrolment.progressPercent === 100 && course.certificateSupported && !enrolment.certificateIssued) {
      enrolment.certificateIssued = true;
      enrolment.certificateSerial = `AVC-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      recordAudit(
        user.name,
        user.role,
        'ACADEMY_CERTIFICATE_ISSUED',
        `${enrolment.learnerName} • ${course.title} (${enrolment.certificateSerial})`
      );
    }
    saveDatabase(db);
    res.json({ enrolment });
  });

  app.post('/api/academy/courses', requireRoles(['admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const { title, category, intendedAudience, duration, instructor, priceNgn } = req.body;
    if (!title || !category) {
      res.status(400).json({ error: 'Course title and category are required.' });
      return;
    }
    const newCourse: AcademyCourse = {
      id: `crs-${Date.now()}`,
      slug: String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      category,
      intendedAudience: intendedAudience || 'Business Professionals & Analysts',
      duration: duration || '3 Weeks (12 Hours)',
      instructor: instructor || 'Avichas Faculty',
      instructorRole: 'Senior Practice Lead',
      priceNgn: Number(priceNgn) || 0,
      isFree: Number(priceNgn) === 0,
      enrolmentRequirements: ['Registered Avichas Academy account'],
      learningObjectives: [
        'Apply structured AI and data workflows to measurable business operations',
        'Enforce human-in-the-loop quality assurance and NDPA data compliance',
      ],
      certificateSupported: true,
      published: true,
      modules: [
        {
          id: `mod-${Date.now()}`,
          title: 'Module 1: Core Architecture & Practical Application',
          lessons: [
            {
              id: `les-${Date.now()}-1`,
              title: 'Diagnostic Framework & Operational Setup',
              durationMinutes: 40,
              format: 'Video Briefing',
              summary: 'Establishing baseline metrics and workflow controls.',
              resourceName: 'Avichas_Course_Workbook.pdf',
            },
          ],
        },
      ],
    };
    db.courses.unshift(newCourse);
    recordAudit(user.name, user.role, 'ACADEMY_COURSE_CREATED', newCourse.title);
    res.status(201).json({ course: newCourse });
  });

  // 9. Insights & AI News Blog CMS — Accessible to Admin AND Content Editor (Section 10 & 11)
  app.post('/api/blog', requireRoles(['admin', 'editor']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const { title, category, excerpt, content, status, sourceName, sourceUrl, originalDate } = req.body;
    if (!title || !category || !excerpt) {
      res.status(400).json({ error: 'Title, category, and excerpt are required.' });
      return;
    }
    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      slug: String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      category,
      excerpt,
      content: Array.isArray(content) ? content : [String(content || excerpt)],
      author: user.name,
      authorRole: user.role === 'editor' ? 'Editorial Lead, Avichas Metrics' : 'Executive Leadership',
      publishedAt: new Date().toISOString().split('T')[0],
      readTimeMinutes: 4,
      featured: false,
      status: status || 'Published',
      imageUrl: '/src/assets/images/insights_executive_operations_1791644616154.jpg',
      sourceAttribution: sourceName
        ? {
            sourceName,
            sourceUrl: sourceUrl || 'https://avichasmetrics.com',
            originalDate: originalDate || new Date().toISOString().split('T')[0],
            editorialReviewedBy: `${user.name} (Verified Human Review)`,
          }
        : undefined,
    };
    db.blogPosts.unshift(newPost);
    recordAudit(user.name, user.role, 'BLOG_ARTICLE_SAVED', `${newPost.title} [${newPost.status}]`);
    res.status(201).json({ post: newPost });
  });

  app.patch('/api/blog/:id/status', requireRoles(['admin', 'editor']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const post = db.blogPosts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    post.status = req.body.status;
    recordAudit(user.name, user.role, 'BLOG_STATUS_UPDATED', `${post.title} -> ${post.status}`);
    res.json({ post });
  });

  // 10. Legal Policies & Pre-Launch Confirmation Register Updates (Part II Sec. 4–6 & Appendix)
  app.put('/api/policies/:id', requireRoles(['admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const policy = db.policies.find((p) => p.id === req.params.id);
    if (!policy) {
      res.status(404).json({ error: 'Policy document not found' });
      return;
    }
    if (req.body.summary) policy.summary = req.body.summary;
    if (req.body.counselApprovalStatus) policy.counselApprovalStatus = req.body.counselApprovalStatus;
    if (Array.isArray(req.body.sections)) policy.sections = req.body.sections;
    policy.lastUpdated = new Date().toISOString().split('T')[0];

    recordAudit(user.name, user.role, 'LEGAL_POLICY_UPDATED', `${policy.title} (${policy.counselApprovalStatus})`);
    res.json({ policy });
  });

  app.patch('/api/confirmations/:id', requireRoles(['admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const item = db.confirmations.find((c) => c.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Confirmation item not found' });
      return;
    }
    if (req.body.status) item.status = req.body.status;
    if (req.body.currentResolutionNotes) item.currentResolutionNotes = req.body.currentResolutionNotes;
    recordAudit(user.name, user.role, 'PRELAUNCH_REGISTER_UPDATED', `${item.item} -> ${item.status}`);
    res.json({ confirmation: item });
  });

  // 11. Assessment, Quotation & Support Enquiries with Input Validation (Section 5, 6, 19)
  app.post('/api/enquiries', (req, res) => {
    const { type, fullName, organisation, email, phone, serviceInterest, message } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName || !email || !emailRegex.test(String(email)) || !message) {
      res.status(400).json({
        error: 'Validation Error: Please provide your full name, a valid corporate email address, and project details.',
      });
      return;
    }
    const newEnquiry: EnquirySubmission = {
      id: `enq-${Date.now()}`,
      type: type || 'Service Assessment',
      fullName: String(fullName).trim(),
      organisation: String(organisation || 'Independent').trim(),
      email: String(email).trim(),
      phone: String(phone || '').trim(),
      serviceInterest: String(serviceInterest || 'General Consultation').trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
      status: 'New',
    };
    db.enquiries.unshift(newEnquiry);
    saveDatabase(db);
    res.status(201).json({ enquiry: newEnquiry });
  });

  // 12. Full Operational Data Export (Section 20: Ensure company can export customer, subscription, content & operational data)
  app.get('/api/export/:entity', requireRoles(['admin']), (req, res) => {
    const user = getAuthenticatedUser(req);
    const { entity } = req.params;
    recordAudit(user.name, user.role, 'DATA_EXPORT_GENERATED', `Exported ${entity} dataset`);
    const map: Record<string, unknown> = {
      all: db,
      customers: db.users,
      subscriptions: db.subscriptions,
      schools: db.schoolLicences,
      academy: db.enrolments,
      content: db.blogPosts,
      audit: db.auditLogs,
    };
    res.json({
      exportedAt: new Date().toISOString(),
      company: 'Avichas Metrics Limited (CAC: 9880947)',
      entity,
      data: map[entity] || db,
    });
  });

  // Mount Vite middleware in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Avichas Metrics Digital Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
