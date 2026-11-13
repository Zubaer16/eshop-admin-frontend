# Single Admin workspace — 2026-11-13

Owner requested the approved preview design with real API content, consistent design for new features and no API changes.

Implemented one rendering path for all Admin pages. Removed runtime mode selection, mock Zustand store, fixtures, prototype policy/report adapters, duplicate preview components and old preview-only browser tests. Removed unused Zustand. Kept original shared shell, tokens and dialogs; restored dashboard metric/chart panels, richer catalog table, order table, staff table and shared management presentation.

All existing API clients and handlers remain authoritative: routes, methods, DTO payloads, minor units, revision checks, idempotency, current grants and uncertain-write protection are preserved. Backend source/schema fingerprint is verified separately. Backend audit scripts and contract metadata now point to actual connected files after mock-file deletion; this is source-evidence maintenance, not an API change.

Validation: 48 unit tests passed. Production build, typecheck, lint and source guard passed. 24/24 production browser tests passed, recorded in test-results/admin/results.json. Responsive validation passed at 320, 390, 768 and 1440 pixels. The browser suite uses intercepted API-shaped responses and writes only to those intercepts. It does not validate live provider delivery, real database workflows or deployed Vercel parity. No commit, push, deployment, database change or external provider operation performed.

Original preview workflows under the older docs are historical references. The current design system and API contracts govern future work. Existing local `.env.example` edits were preserved.

Backend API/business/schema verification: 401 files under src and prisma, SHA-256 ce787ee70d35598b670593e3699e7ac6d1a267a4323e18cf820f05c6c5ebdfae before and after. Hash input is each directory (src, then prisma), sorted relative paths and exact bytes. No source/schema diff. Cross-repo strict source alignment: 7 MATCH / 15 ADAPTER / 0 REVIEW_REQUIRED, 4 regression tests passed. Web source audit: 202 operations, 21 pages in each frontend, 22 feature groups.
