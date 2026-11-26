# Admin post-Promotions standard design — 2026-11-26

## Source baseline

Owner-provided `eshop-admin-frontend-full-20261126-174929.zip`.

The Promotions page is the already-delivered premium design anchor in this source snapshot, including its stable `pageData` pagination nullability correction. This overlay standardizes the subsequent Admin navigation sections through Audit Activity; it does not replace or modify Promotions itself.

## Pages included

The following 12 routes are standardized:

1. `/content` — Store content
2. `/shipping` — Shipping & taxes
3. `/payments` — TEST payment records
4. `/reports` — Reports
5. `/media` — Media library
6. `/notifications` — Notification inbox
7. `/messaging` — Rich messaging campaigns
8. `/operations` — Operations
9. `/alignment` — Frontend compatibility
10. `/staff` — Staff & roles
11. `/settings` — Store settings
12. `/activity` — Audit activity

## Shared design language

- Consistent PageHeading hierarchy with an eyebrow, title and explanatory description.
- Reusable AdminTabs, AdminNotice, AdminMetricCard and AdminEmptyState primitives.
- White, bordered, rounded workspace panels with consistent section headings and action placement.
- Responsive desktop tables and mobile record cards where records are tabular.
- Server-derived counts only; no fabricated KPI, aggregate or status breakdown.
- Explicit status badges, readable UTC timestamps and tabular numeric presentation.
- Consistent filter toolbars, refresh feedback, loading/error states and empty states.
- Existing keyboard focus visibility and reduced-motion behavior remain intact.

## Business and security preservation

This is an Admin Frontend presentation and UX overlay only.

- Store content keeps the same `/v1/admin/store/banners` and `/v1/admin/store/collections` routes, DTOs, statuses, revision guards, canonical media/product IDs, and inclusive-start/exclusive-end publication windows.
- Shipping remains OWNER-only for configuration. Default/country currency lanes, country override behavior, minor-unit inputs, zone service definitions, revision handling and deletion semantics are unchanged.
- Payment reporting keeps `/v1/admin/reports/payments`, the same status/currency/date query fields, UTC inclusive-start/exclusive-end day interpretation, exact lifetime-refund minor-unit strings and server-owned payment states. No browser financial totals are calculated.
- Report domain permission filtering, report/export routes, bounded pagination and exact currency behavior remain unchanged.
- Media upload still uses the existing upload-instruction/provider-transfer/server-verification flow, accepted MIME types and 10 MiB client bound. Asset deletion remains scheduled under retention; verified asset IDs and the six-image product gallery bound are unchanged.
- Notification inbox keeps the same account-owned API routes, session epoch/user ownership guard, safe destination validation, revision-checked preferences, marketing confirmation and browser push lifecycle.
- Push messaging keeps the same draft/preview/metrics/cancel/approval endpoints, marketing-consent requirement, verified media/canonical target rules and OWNER approval boundary. Provider acceptance is not represented as device display.
- Operations keeps the existing read endpoints and only queues the existing exhausted DB-only in-app receipt retry. No provider submission replay or payment-job retry was added.
- Staff and role forms keep their DTO allowlists and existing Backend authorization; permission editing remains owner-governed.
- Store settings keep the existing config/template endpoints, DTO contracts, revision values, OWNER-only boundary, verified branding IDs and deployment-owned CORS boundary.
- Audit Activity remains a server-event view with the existing bounded pagination and optional actor UUID filter; no browser-local events are invented.
- Admin cache allowlist/TTLs, session ownership, role/permission/epoch fencing, speculative prefetch rules and Backend authorization remain unchanged.

No Backend source, API contract, DTO, database schema, migration, payment, inventory, shipping calculation, provider configuration or deployment setting is changed.

## Overlay manifest

**2 NEW + 13 REPLACE = 15 files.**

NEW:
- `components/ui/admin-workspace.tsx`
- `docs/ADMIN_POST_PROMOTIONS_STANDARD_DESIGN_20261126.md`

REPLACE:
- `components/catalog/media.tsx`
- `components/commerce/forms.tsx`
- `components/commerce/payments.tsx`
- `components/commerce/shipping.tsx`
- `components/management/alignment.tsx`
- `components/management/content.tsx`
- `components/management/push-campaigns.tsx`
- `components/management/reports.tsx`
- `components/management/settings.tsx`
- `components/management/shared.tsx`
- `components/management/staff.tsx`
- `components/notifications/inbox.tsx`
- `e2e/admin.spec.mjs`

`package.json`, `package-lock.json`, route files, Promotions component, API client, cache policy and Backend integration files are not part of this overlay.

## Preparation validation

- `node scripts/verify-project.mjs` — PASS.
- TypeScript TSX syntax transpilation for all 13 changed/new TSX files — PASS.
- `node --check e2e/admin.spec.mjs` — PASS.
- Unit suite — 99/99 PASS using the globally available TypeScript module with Node 22 experimental type stripping in the temporary preparation workspace.
- Full dependency-backed `npm run typecheck`, `npm run lint`, `npm run build` and Playwright browser execution — **PENDING OWNER RUN**. The preparation environment has Node 22.16.0 while the project requires Node `>=24 <25`; dependency installation did not complete in the preparation environment. Do not mark the patch build-accepted or browser-accepted until those owner checks pass on the required Node 24 environment.

No Git commit/push, database operation, provider call or production deployment was performed.
