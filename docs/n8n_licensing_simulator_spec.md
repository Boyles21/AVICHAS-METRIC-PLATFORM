# School-Side n8n Deployment & Licensing API Specification

*Document reference: Avichas Metrics Limited - Developer Specification Section 8C & 8D*

## Architecture Overview
Participating primary and secondary schools run approved academic workflows on their own self-hosted n8n instances (desktop or school intranet server). Avichas operates the central licensing, credit entitlement, and subscription verification API over HTTPS.

## Execution Sequence
```text
[School n8n Trigger]
         │
         ▼
[1. Licence & Entitlement Check: POST /api/v1/licensing/verify]
         │
         ├─► (DENY: Expired / Insufficient Credits / Invalid Key) ──► Stop Execution & Alert Admin
         │
         ▼ (ALLOW: Signed Entitlement Token Issued)
[2. Validate School Inputs (Broadsheet / Lesson Note Template)]
         │
         ▼
[3. Process Authorised AI Task]
         │
         ▼
[4. Record Usage Deductions in Audit Log]
         │
         ▼
[5. Return Completed Result to School]
```

## Threat Model & Local Workflow Bypass Analysis
1. **The Vulnerability:**
   Because the school administrator owns and controls their local n8n instance, they can technically open the workflow editor, view node configurations, and delete or bypass the initial HTTP Request node that queries the Avichas Licensing API.
2. **The Mitigation:**
   A local HTTP check node alone CANNOT prevent unauthorized execution if downstream nodes directly call an AI provider using school-owned API keys.
   - For high-value Avichas IP (e.g. customized evaluation algorithms, proprietary result variance analysis schemas), execution must be handled via a signed backend connector (`avc_sig_*`).
   - If an unsigned or expired token is presented, downstream processing is refused.
3. **Offline Grace Cache Window:**
   To accommodate intermittent Nigerian school internet connectivity, the Licensing API issues a cryptographically signed entitlement token valid for up to 72 hours (or 50 executions).
   - Once 72 hours elapse without internet verification, the local workflow locks until connection is restored.
   - Note: Immediate subscription stoppage cannot be guaranteed while a school server is fully offline.
