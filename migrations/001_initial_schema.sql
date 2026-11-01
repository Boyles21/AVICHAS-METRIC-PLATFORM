-- ====================================================================
-- AVICHAS METRICS LIMITED - MIGRATION 001: INITIAL SCHEMA
-- Target Engine: PostgreSQL 15+ (Neon Serverless Postgres)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'school_admin', 'learner', 'editor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('Active', 'Pending Verification', 'Past Due', 'Expired', 'Cancelled', 'Suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE licence_status AS ENUM ('Pending activation', 'Active', 'Suspended', 'Expired', 'Cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('Paid (Verified)', 'Pending Webhook', 'Failed', 'Refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('Published', 'Draft', 'Scheduled', 'Review Required (AI Sourced)');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Organisations Table
CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cac_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Auth Tables (Excluded from tenant RLS, managed exclusively by auth layer)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(organisation_id);

CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_verif_token ON public.email_verifications(token_hash);

CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pass_resets_token ON public.password_resets(token_hash);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits(reset_at);

-- 3. Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  category TEXT NOT NULL,
  price_ngn NUMERIC NOT NULL,
  billing_interval TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  credit_allowance INTEGER NOT NULL DEFAULT 2500,
  credit_unit_definition TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  permitted_workflows TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tenant Entities (Subject to Row-Level Security)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  amount_ngn NUMERIC NOT NULL,
  billing_interval TEXT NOT NULL,
  status subscription_status NOT NULL DEFAULT 'Pending Verification',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  payment_provider TEXT NOT NULL DEFAULT 'Paystack',
  payment_reference TEXT NOT NULL UNIQUE,
  webhook_verified BOOLEAN NOT NULL DEFAULT false,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(organisation_id);

CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  amount_ngn NUMERIC NOT NULL,
  status payment_status NOT NULL DEFAULT 'Paid (Verified)',
  provider_reference TEXT NOT NULL,
  description TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organisation_id);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_kobo BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  provider TEXT NOT NULL DEFAULT 'Paystack',
  reference TEXT NOT NULL UNIQUE,
  status payment_status NOT NULL DEFAULT 'Paid (Verified)',
  raw_webhook_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON public.payments(organisation_id);

CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  school_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  state_location TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_schools_org_id ON public.schools(organisation_id);

CREATE TABLE IF NOT EXISTS public.licences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  licence_key_hash TEXT NOT NULL UNIQUE,
  licence_key_last4 TEXT NOT NULL,
  status licence_status NOT NULL DEFAULT 'Active',
  activation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  credit_allowance INTEGER NOT NULL DEFAULT 2500,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credit_unit TEXT NOT NULL DEFAULT 'Workflow Executions',
  permitted_features TEXT[] NOT NULL DEFAULT '{"result_analysis","lesson_planning","report_preparation"}',
  deployment_status TEXT NOT NULL DEFAULT 'Local n8n Configured',
  n8n_instance_version TEXT NOT NULL DEFAULT 'n8n@1.62.4 (Self-Hosted)',
  last_verification_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_licences_org_id ON public.licences(organisation_id);
CREATE INDEX IF NOT EXISTS idx_licences_school_id ON public.licences(school_id);
CREATE INDEX IF NOT EXISTS idx_licences_key_hash ON public.licences(licence_key_hash);

CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  licence_id UUID NOT NULL REFERENCES public.licences(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  credits_deducted INTEGER NOT NULL DEFAULT 1,
  remaining_credits INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  reason TEXT,
  ip_address TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_records_org_id ON public.usage_records(organisation_id);

-- 5. Courses & Academy Tables
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  intended_audience TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructor TEXT NOT NULL,
  instructor_role TEXT NOT NULL,
  price_ngn NUMERIC NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  enrolment_requirements TEXT[] NOT NULL DEFAULT '{}',
  learning_objectives TEXT[] NOT NULL DEFAULT '{}',
  certificate_supported BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  format TEXT NOT NULL DEFAULT 'Video Briefing',
  summary TEXT NOT NULL,
  resource_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrolments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'Paid (Verified)',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  quiz_score INTEGER,
  certificate_issued BOOLEAN NOT NULL DEFAULT false,
  certificate_serial TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(learner_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrolments_org_id ON public.enrolments(organisation_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_learner_id ON public.enrolments(learner_id);

CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  enrolment_id UUID NOT NULL REFERENCES public.enrolments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enrolment_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_comp_org_id ON public.lesson_completions(organisation_id);

CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  enrolment_id UUID NOT NULL UNIQUE REFERENCES public.enrolments(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_certificates_org_id ON public.certificates(organisation_id);

-- 6. Services & Public Content
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  index_number TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  short_summary TEXT NOT NULL,
  business_problem TEXT NOT NULL,
  designed_for TEXT[] NOT NULL DEFAULT '{}',
  what_avichas_provides TEXT[] NOT NULL DEFAULT '{}',
  how_it_works TEXT[] NOT NULL DEFAULT '{}',
  expected_benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  implementation_process TEXT[] NOT NULL DEFAULT '{}',
  commercial_model TEXT NOT NULL,
  starting_price_ngn NUMERIC NOT NULL,
  billing_cadence TEXT NOT NULL,
  availability_status TEXT NOT NULL,
  cta_label TEXT NOT NULL,
  cta_action TEXT NOT NULL,
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT[] NOT NULL DEFAULT '{}',
  author TEXT NOT NULL,
  author_role TEXT NOT NULL,
  published_at DATE,
  scheduled_at TIMESTAMPTZ,
  read_time_minutes INTEGER NOT NULL DEFAULT 5,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status post_status NOT NULL DEFAULT 'Published',
  image_url TEXT,
  source_attribution JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  full_name TEXT NOT NULL,
  organisation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_interest TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
