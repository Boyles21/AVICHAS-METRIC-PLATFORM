-- ====================================================================
-- AVICHAS METRICS LIMITED - MIGRATION 003: POLICIES, CONFIRMATIONS & LICENCE EXTENSIONS
-- ====================================================================

-- 1. Licence Table Extensions
ALTER TABLE public.licences ADD COLUMN IF NOT EXISTS licence_key TEXT;
ALTER TABLE public.licences ADD COLUMN IF NOT EXISTS ai_provider_configured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.licences ADD COLUMN IF NOT EXISTS ai_provider_name TEXT;
ALTER TABLE public.licences ADD COLUMN IF NOT EXISTS masked_api_key TEXT;
ALTER TABLE public.licences ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT;

CREATE INDEX IF NOT EXISTS idx_licences_licence_key ON public.licences(licence_key);

-- 2. Legal Policies Table
CREATE TABLE IF NOT EXISTS public.policies (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  counsel_approval_status TEXT NOT NULL DEFAULT 'Draft — Pending Nigerian Legal Counsel Review',
  regulatory_framework TEXT NOT NULL,
  summary TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Pre-Launch Confirmations Table
CREATE TABLE IF NOT EXISTS public.pre_launch_confirmations (
  id TEXT PRIMARY KEY,
  item TEXT NOT NULL,
  part_reference TEXT NOT NULL,
  required_decision_evidence TEXT NOT NULL,
  current_resolution_notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  owner TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS and Grant Permissions
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_launch_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_policies ON public.policies;
CREATE POLICY public_read_policies ON public.policies
  FOR SELECT USING (true);

DROP POLICY IF EXISTS admin_manage_policies ON public.policies;
CREATE POLICY admin_manage_policies ON public.policies
  FOR ALL
  USING (current_setting('app.role', true) IN ('admin', 'system'))
  WITH CHECK (current_setting('app.role', true) IN ('admin', 'system'));

DROP POLICY IF EXISTS admin_manage_confirmations ON public.pre_launch_confirmations;
CREATE POLICY admin_manage_confirmations ON public.pre_launch_confirmations
  FOR ALL
  USING (current_setting('app.role', true) IN ('admin', 'system'))
  WITH CHECK (current_setting('app.role', true) IN ('admin', 'system'));

-- Grant table privileges to unprivileged app_user role if it exists
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.policies TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_launch_confirmations TO app_user;
  END IF;
END $$;
