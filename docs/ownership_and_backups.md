# Infrastructure Ownership, Restoration Windows & Backup Procedures

*Document reference: Avichas Metrics Limited - Handover & Operations Guide*

## 1. Account Ownership at Handover
Before production public launch, ownership of the following external cloud infrastructure services must be created in or transferred directly to Avichas Metrics Limited corporate accounts:

1. **Neon Serverless Postgres Account:**
   - Account email: Must be registered using an Avichas corporate domain (e.g. `ops@avichasmetrics.com` or `dev@avichasmetrics.com`).
   - Project: `avichas-metrics-production`
   - Billing & Ownership: Owned exclusively by Avichas Metrics Limited.
2. **Render Web Service & Cron Account:**
   - Account: Owned by Avichas Metrics Limited.
   - Connected GitHub repository: Avichas Metrics official organization repository.
3. **Resend Account (Transactional Email):**
   - Verified sending domain: `avichasmetrics.com` (configured with DKIM, SPF, and DMARC DNS records).
4. **Paystack Merchant Account:**
   - Registered under Avichas Metrics Limited (CAC: 9880947).

The developer or agency must NOT retain sole administrative control or personal credentials over any production resources at handover.

---

## 2. Neon Point-in-Time Restoration Windows
Neon provides point-in-time recovery (PITR) and branching:

- **Free Tier:** 24-hour restore window.
- **Launch Tier ($19/mo):** 7-day point-in-time recovery window with instant branch creation.
- **Scale Tier ($69/mo):** Up to 30-day point-in-time recovery window with configurable timeline resets.

*Honest Operational Notice:* Automated multi-cloud offsite cold storage (e.g., S3/GCS cross-region cold archive) is **NOT** configured out of the box in this build and should not be falsely claimed to clients. If cold backup replication is required for regulatory compliance under the Nigeria Data Protection Act (NDPA), a daily export job using `npm run backup` to an encrypted AWS S3 / Cloudflare R2 bucket should be scheduled in Phase 5.

---

## 3. Manual Point-in-Time Database Backup
An automated CLI command has been provided:

```bash
npm run backup
```

This uses `pg_dump` against `DATABASE_URL_MIGRATE` to create a standalone, timestamped SQL dump in the `backups/` directory:
- Format: Plain-text clean SQL (`--clean --if-exists --no-owner --no-privileges`).
- To restore:
  ```bash
  psql "$DATABASE_URL_MIGRATE" -f backups/avichas-backup-<timestamp>.sql
  ```
