-- ====================================================================
-- AVICHAS METRICS LIMITED - MIGRATION 002: ROW LEVEL SECURITY & APP_USER PERMISSIONS
-- ====================================================================

-- 1. Enable and Force RLS on all Tenant Tables
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools FORCE ROW LEVEL SECURITY;

ALTER TABLE public.licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licences FORCE ROW LEVEL SECURITY;

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records FORCE ROW LEVEL SECURITY;

ALTER TABLE public.enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates FORCE ROW LEVEL SECURITY;

-- 2. Tenant Isolation Policies based on transaction-local current_setting('app.org_id', true)
-- When app.org_id is unset or empty, NULLIF returns NULL, which never matches, returning zero rows.

-- Organisations
DROP POLICY IF EXISTS tenant_organisations_policy ON public.organisations;
CREATE POLICY tenant_organisations_policy ON public.organisations
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Subscriptions
DROP POLICY IF EXISTS tenant_subscriptions_policy ON public.subscriptions;
CREATE POLICY tenant_subscriptions_policy ON public.subscriptions
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Invoices
DROP POLICY IF EXISTS tenant_invoices_policy ON public.invoices;
CREATE POLICY tenant_invoices_policy ON public.invoices
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Payments
DROP POLICY IF EXISTS tenant_payments_policy ON public.payments;
CREATE POLICY tenant_payments_policy ON public.payments
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Schools
DROP POLICY IF EXISTS tenant_schools_policy ON public.schools;
CREATE POLICY tenant_schools_policy ON public.schools
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Licences
DROP POLICY IF EXISTS tenant_licences_policy ON public.licences;
CREATE POLICY tenant_licences_policy ON public.licences
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Usage Records
DROP POLICY IF EXISTS tenant_usage_records_policy ON public.usage_records;
CREATE POLICY tenant_usage_records_policy ON public.usage_records
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Enrolments
DROP POLICY IF EXISTS tenant_enrolments_policy ON public.enrolments;
CREATE POLICY tenant_enrolments_policy ON public.enrolments
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR learner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.role', true) IN ('admin', 'system')
    OR learner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- Lesson Completions
DROP POLICY IF EXISTS tenant_lesson_completions_policy ON public.lesson_completions;
CREATE POLICY tenant_lesson_completions_policy ON public.lesson_completions
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
    OR enrolment_id IN (
      SELECT id FROM public.enrolments WHERE learner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

-- Certificates
DROP POLICY IF EXISTS tenant_certificates_policy ON public.certificates;
CREATE POLICY tenant_certificates_policy ON public.certificates
  FOR ALL
  USING (
    current_setting('app.role', true) IN ('admin', 'system')
    OR learner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR organisation_id = NULLIF(current_setting('app.org_id', true), '')::uuid
  );

-- 3. Grants for app_user (Executed conditionally if app_user role exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT USAGE ON SCHEMA public TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
    ALTER ROLE app_user NOBYPASSRLS;
  END IF;
END $$;
