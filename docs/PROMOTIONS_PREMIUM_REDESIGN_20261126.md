# Admin Promotions Premium Redesign — 2026-11-26

## Scope and source baseline

- Admin source baseline: `eshop-admin-frontend-full-20261126-164800.zip`.
- Backend contract reference: supplied `eshop-backend-full-20261120-115509.zip`, `src/promotions/promotions.dto.ts`, `src/promotions/promotions.controller.ts`, and `src/promotions/promotions.service.ts`.
- Scope: Admin Promotions page presentation, form usability, UTC date/time entry and focused regression coverage.
- Backend, database, Prisma schema, migrations, REST paths, DTO keys, permissions, cache policy and business calculations are unchanged.

## Overlay manifest

- NEW: `lib/promotion-presentation.ts`
- NEW: `tests/promotion-presentation.test.mjs`
- NEW: `docs/PROMOTIONS_PREMIUM_REDESIGN_20261126.md`
- REPLACE: `components/commerce/promotions.tsx`
- REPLACE: `e2e/admin.spec.mjs`

Total: 3 NEW + 2 REPLACE = 5 files.

## Presentation changes

- Clear Promotions page heading and explanation of coupon versus editorial campaign responsibilities.
- Accessible Coupons/Campaigns tablist with arrow-key navigation and existing delayed campaign intent prefetch.
- Desktop semantic, horizontally scrollable tables; mobile record cards.
- Search is submitted deliberately rather than requesting on every keystroke; the same server `search`, `page`, and `limit` query contract is retained.
- Server-returned `total`, `page`, `limit`, and `pages` are the only pagination/count source. No fabricated KPI, client-side all-record scan, status filter, or inferred usage count is added.
- Percentage basis points render as percentages (for example, 1,000 bps = 10%). Fixed amounts and minimum/cap values use the existing exact minor-unit formatter and the coupon's currency.
- Full record UUID remains available through a copy-reference control; the visible table/card uses a short display reference.
- Coupon quota usage is shown only from the existing usage endpoint response (`activeClaims` and server `note`). Total/per-customer limits remain distinct from current active claims.
- Start/end windows are shown in UTC with inclusive-start and exclusive-end labels.
- Date/time form controls are entered in UTC, matching the schedule display, and serialize to explicit ISO UTC timestamps. Millisecond precision is retained when present.
- Coupon and campaign forms are grouped into clear sections with field guidance, cancel/close actions, pending feedback and server validation messaging.
- Definite validation errors remain editable; 409 conflicts require refresh/inspection because they may be duplicate code/slug, invalid reference or stale revision; uncertain network/5xx outcomes do not offer a blind retry.
- Campaign notes are explicitly labelled private Admin notes.

## Preserved Backend contract and business rules

### Coupons

- Existing routes only: `GET /v1/admin/promotions/coupons`, `GET /:id`, `GET /:id/usage`, `POST /coupons`, `PUT /coupons/:id`, and `DELETE /:id?expectedRevision=...`.
- Existing write keys remain exactly: `expectedRevision`, `code`, `kind`, `value`, `currency`, `minimumSubtotalMinor`, `maximumDiscountMinor`, `usageLimit`, `perCustomerLimit`, `startsAt`, `endsAt`, `categoryId`, `campaignId`, `enabled`.
- New record `expectedRevision` remains `0`; edits use the server-returned revision.
- Coupon code remains normalized to uppercase; only one coupon code applies per checkout; stacking and FX are not introduced.
- `PERCENT` uses basis points (1,000 = 10%, maximum 10,000); `FIXED` uses currency minor units.
- Currency is an exact three-letter currency lane; no automatic conversion.
- Minimum eligibility remains gross merchandise subtotal. Category membership remains exact, without implicit descendants.
- A campaign UUID is only an eligibility gate; it does not automatically apply a coupon.
- Blank optional cap/limits/references/windows remain `null`. Total capacity continues to count active holds and pending/paid orders according to Backend rules.
- Coupon start is inclusive; end is exclusive. Backend database time remains authoritative.
- Existing coupon disable is a revision-checked soft disable preserving identity, history and existing holds.
- The existing v1 zero-total checkout limitation is not changed.

### Editorial campaigns

- Existing routes only: `GET /v1/admin/promotions/campaigns`, `GET /:id`, `POST /campaigns`, `PUT /campaigns/:id`, and `DELETE /:id?expectedRevision=...`.
- Existing write keys remain exactly: `expectedRevision`, `title`, `slug`, `description`, `status`, `startsAt`, `endsAt`.
- Status values remain `DRAFT`, `SCHEDULED`, `ACTIVE`, `PAUSED`; Active and Scheduled require both timestamps.
- Description remains private Admin notes and is not added to the public campaign projection.
- Campaigns remain editorial; they do not automatically change prices or send push messages.
- Existing pause operation remains revision-checked and preserves history and coupon associations.

## Validation performed during patch preparation

- `node scripts/verify-project.mjs`: PASS.
- `node --check e2e/admin.spec.mjs`: PASS.
- TypeScript `transpileModule` syntax diagnostics for `components/commerce/promotions.tsx` and `lib/promotion-presentation.ts`: PASS (2/2).
- Focused presentation helper tests: PASS (3/3) using the available Node 22.16.0 runtime with `--experimental-strip-types`.
- Added Playwright coverage for responsive coupon directory, exact coupon/campaign write payloads, timezone instant preservation, keyboard tab navigation, uncertain-write no-retry behavior, and retained campaign prefetch behavior. E2E JavaScript syntax passed; browser execution was not available in this preparation environment.

## Owner-run validation still required

The repository pins Node 24 (`.nvmrc` = `24`, package engine `>=24 <25`). The preparation environment only provides Node 22.16.0 and does not contain Admin `node_modules`; therefore dependency-backed typecheck, lint, production build and Playwright browser execution are NOT claimed as passed.

From the Admin repository root on Node 24, run:

```powershell
npm ci
npm run verify
npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run test:e2e -- --api-origin https://api.example.test
```

For a separate interactive development smoke check, run `npm run dev` and stop it with `Ctrl+C` when finished.

The E2E runner performs a production build and starts the app on `127.0.0.1:3213`; domain and session API requests are intercepted by the Playwright suite. Use the configured HTTPS Backend origin in place of the example origin if required by the local environment.

No Backend/database changes, migration, provider call, Git commit/push or deployment were performed by this overlay.


## Owner-reported build type-check correction — 2026-11-26

The owner ran `npm run build` after applying the original overlay. Next.js compilation completed, then its TypeScript validation failed at the Previous pagination callback because `list.data` is nullable and TypeScript does not retain the property narrowing inside that callback. The corrective overlay captures the resource result once as `const pageData = list.data` and uses that stable snapshot throughout the count, result rendering and both Previous/Next pagination callbacks. The render remains guarded by `pageData`; no non-null assertion, fallback record, API change or business-rule change is introduced.

**Corrective overlay manifest:** REPLACE `components/commerce/promotions.tsx` and REPLACE this document. Total: 0 NEW + 2 REPLACE = 2 files.

**Preparation validation:** corrected TSX transpile syntax PASS; isolated strict TypeScript control-flow check for the nullable page snapshot and both callbacks PASS; `node scripts/verify-project.mjs` PASS on the combined post-redesign/corrected source tree; `node --check e2e/admin.spec.mjs` PASS. Full repository `npm run typecheck`, `npm run lint`, and `npm run build` were not executable in this preparation environment because the project dependencies are not installed and the available runtime is Node 22.16.0 rather than the repository's required Node 24. Owner must rerun these commands after applying the corrective overlay.
