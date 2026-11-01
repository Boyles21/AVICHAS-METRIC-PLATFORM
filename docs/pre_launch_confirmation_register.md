# Pre-Launch Confirmation Register

*Document reference: Avichas Metrics Limited - Developer Specification Appendix (Page 16)*

This register records all decisions, third-party agreements, and evidence required before public production deployment.

| Item | Specification Reference | Required Decision / Evidence | Implementation Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| **01. Brand System** | Part I Sec. 2 & Part II Sec. 2–3 | Approved final colour tokens and typefaces, with valid commercial web licences. | Unified theme using Deep Navy (`#0B1F33`), Muted Gold (`#B5965A`), AI Blue (`#4778A8`), Stone (`#EDE7D9`), and Charcoal (`#2E3A44`). Font pairings configured via Google Fonts (`Cormorant Garamond` / `Playfair Display` + `Plus Jakarta Sans`) pending licensed Canela / Neue Haas Grotesk `.woff2` files. | In Review |
| **02. Contact Channels** | Part II Sec. 1 | Tested phone and WhatsApp destinations; confirm international formatting. | AI Receptionist (Ava) clickable voice link `+1 (234) 815-6687` and WhatsApp Business chat link `https://wa.me/2348165705114` separated across header, footer, and contact desk. | Confirmed |
| **03. Legal Pages** | Part II Sec. 4 | Final policy text reviewed and approved by qualified Nigerian legal counsel. | 6 statutory policies published with explicit draft warnings. Pending sign-off by accredited Nigerian Data Protection Act (NDPA) legal practitioner. | Open |
| **04. Payment Integration** | Part I Sec. 7 | Provider selected; current fees/features reviewed; webhook verification tested. | Paystack selected for Nigerian Naira (`NGN`) card, USSD, and bank transfer payments. Server-side initialisation and raw payload HMAC SHA-512 webhook verification implemented. | In Review |
| **05. School Licensing** | Part I Sec. 8C–8D & Sec. 20 | Threat model and enforcement limits documented; n8n licence terms validated. | Cryptographic licence generation (`AVC-SCH-*`), atomic credit deduction, and signed Ed25519/HMAC 72-hour offline entitlement cache implemented in `server.ts`. Threat model documented for customer-controlled n8n instances. | In Review |
| **06. School Data Flows** | Part I Sec. 8E & Part II Sec. 4.6 | Documented data map covering school infrastructure, Avichas, AI providers, logs and backups. | 3-tier boundary documented: Student PII remains on school premises; only cryptographic entitlement metadata traverses Avichas Licensing API. | Confirmed |
| **07. Academy Delivery** | Part I Sec. 9D | LMS versus custom module decision documented with cost and maintenance rationale. | Modular internal LMS selected to eliminate recurring USD SaaS charges ($100-$200/mo) and prevent account fragmentation with the Client Portal. | Confirmed |
| **08. Operational Readiness**| Part I Sec. 13–14 | Staging, monitoring, backups, restoration test and incident response documented. | Supabase PostgreSQL migration schema with Row Level Security, persistent IP rate limiting, and automated scheduled maintenance job. | In Review |
| **09. Acceptance Testing** | Part I Sec. 19 | Evidence for each acceptance criterion recorded and signed off. | End-to-end audit completed. Test steps provided for every functional module. | In Review |
