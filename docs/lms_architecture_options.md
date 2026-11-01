# Avichas Academy: LMS Delivery Architecture Decision

*Document reference: Avichas Metrics Limited - Developer Specification Section 9D & Appendix*

## Executive Summary
This document provides the cost, maintainability, security, and customer experience rationale for evaluating whether Avichas Academy should use a third-party Learning Management System (LMS) or an integrated custom module.

## Options Evaluated

### Option 1: Integrated Custom Academy Module (Selected)
- **Description:** Built natively into the Avichas digital platform, sharing the Supabase PostgreSQL database, unified authentication, and direct Paystack Naira checkout.
- **Cost:** ₦0/month additional SaaS subscription fees.
- **Maintainability:** Shared React frontend components and standard database schemas for courses, modules, lessons, enrolments, and certificates.
- **Security:** Learner data stays within Avichas's own database boundary; no third-party data processor agreements required for video or progress records.
- **User Experience:** Seamless single sign-on (SSO); corporate and school customers access their training courses using the same credentials without redirects to external subdomains.

### Option 2: Standalone Cloud SaaS (Thinkific / Teachable)
- **Description:** Hosting courses on an external platform (e.g. `academy.avichasmetrics.com` pointing to Thinkific).
- **Cost:** $99 to $199 USD per month (~₦1,800,000 to ₦3,600,000 per year) subject to currency fluctuation.
- **Maintainability:** Low technical maintenance for video encoding, but high operational friction for syncing customer records.
- **Drawbacks:** Requires third-party webhook bridges (Zapier/Make) to reconcile Paystack Naira payments, creating delayed access activation. Disconnects corporate portal accounts from learner accounts.

### Option 3: Self-Hosted Open Source (Moodle / Canvas LMS)
- **Description:** Deploying an independent PHP/MySQL Moodle server alongside the main platform.
- **Cost:** Requires dedicated cloud hosting ($40-$80/month) and substantial ongoing systems administration.
- **Drawbacks:** Complex PHP stack maintenance, separate database, legacy user interface that clashes with the Avichas premium executive brand aesthetic.

## Final Recommendation
Deploy the **Integrated Custom Academy Module** for Phase 1–4. If course video bandwidth or interactive SCORM requirements exceed capacity in future scaling phases, migrate media delivery to an enterprise video CDN (e.g. Cloudflare Stream / Vimeo OTT) while retaining native enrolment and certificate governance in the Avichas database.
