# eShop Admin

## Current API integration and routing

Live API features are implemented with explicit preview mode kept separate. Each page renders its own feature; shared boundaries enforce authentication/current permissions. Current executed checks, accepted v1 limits and separate provider/deployment acceptance are tracked in the sibling eshop-backend/docs/WEB_VALIDATION.md report. Earlier implementation-time deferral notes below are historical.

Product name: **eShop**; package name: `eshop-admin-frontend`. Existing checkout folders and persisted technical identifiers remain compatible.

A responsive commerce administration frontend for the eShop single-vendor, multi-category international store.

## Technology

- Next.js 15 App Router, React 19 and TypeScript
- Tailwind CSS 4 and editable shadcn-style component primitives
- Radix UI dialogs and Lucide icons
- Zustand with browser-local persistence for interface prototyping
- Playwright for end-to-end user interaction testing

## Quick start

Requires **Node.js 24** and npm.

```powershell
npm install --include=dev
npm run dev
```

Open <http://localhost:3000>. The root route requires staff sign-in in live mode. Set explicit preview mode to explore sample business screens.

## Explicit preview sections

- **Dashboard:** summary KPIs, illustrative sales trend, alerts, recent orders
- **Products:** search, filter, create/edit products, size/color/SKU variants, image references and preview stock totals
- **Categories:** add, edit, nest subcategories and delete only unused leaf categories
- **Inventory:** simulate product or variant-level stock adjustments with a recent-activity list
- **Orders:** itemized order details, forward-only fulfillment transitions, local shipment tracking, cancellation, return decisions, refund preview and activity timeline
- **Customers:** view sample customer profiles and sales history
- **Promotions:** locally manage coupons and marketing campaigns with USD discount previews
- **Store content:** edit sample hero banners and featured product collections
- **Shipping & taxes:** configure local-only international zones, sample rates, thresholds and illustrative tax rules
- **Payment reporting:** search/filter read-only, fictional payment examples; never real Stripe transactions
- **Staff & roles:** sample staff records and editable visual permission matrix (not enforced)
- **Store settings:** draft store identity, timezone and support preferences; English/USD locked
- **Activity preview:** browser-local history for staff, roles and settings edits only

All UI text is English, and all displayed prices use USD. No special Bangladesh market mode exists.

## Important limitation

This is a **frontend-only workspace**. It does not authenticate administrators, enforce real permissions, process transactions, connect to Stripe or update a server database. Sample records and edits are saved to **localStorage in your own browser**. They are not shared between devices and must not be used as real merchant operations. Use **Reset sample data** in the navigation to restore the seed records.

Do not publicly deploy this preview as a functioning administration system. Real staff authentication, role-based access control, sensitive-data protection, audit logs, inventory integrity and payment administration require backend integration.

## Promotions and content previews

See [Merchandising workflows](docs/MERCHANDISING.md). Editing a banner or coupon never changes the public storefront.

## Shipping and payments preview

See [shipping, tax and payment contract notes](docs/SHIPPING_PAYMENT_PREVIEWS.md) and the [two-frontend compatibility audit](docs/CROSS_FRONTEND_ALIGNMENT.md). Admin preview policies are **not transmitted to the Storefront**, whose checkout still uses fixed sample fees.

## Workspace previews

See [workspace previews](docs/WORKSPACE_PREVIEWS.md). Role editing does not secure the Admin. Local activity is not a real audit trail.

## UI and keyboard QA (Patch 08)

Mobile admin navigation now uses an accessible dialog with Escape/focus return. Use **Ctrl+K** (or **Command+K** on Mac) to open searchable quick navigation, with arrow keys and Enter to select a section. Report tabs support arrow keys, Home and End. Long tables can be focused to scroll with the keyboard. See [Admin UI QA checklist](docs/ADMIN_UI_QA.md) for manual checks and limitations.

## Quality checks

```powershell
npm run verify
npm run verify:merchandising
npm run verify:commerce
npm run verify:workspace
npm run verify:reports
npm run verify:ui
npm run typecheck
npm run lint
npm run build
# Verify project structure, typecheck, lint and build with:
npm run check
```

### Browser automation

```powershell
npx playwright install chromium
npm run test:e2e:visual
npm run test:e2e:report
```

Visual testing uses **900 ms after each recorded interaction**, sequential Chromium tests, an initial viewport of 1120 × 600, and starts a development server automatically on port 3101.

Optional terminal overrides:

```powershell
$env:E2E_DELAY_MS="900"
$env:E2E_VIEWPORT_WIDTH="1160"
$env:E2E_VIEWPORT_HEIGHT="620"
npm run test:e2e:visual
```

## Architecture

The admin and customer storefront are separate Next.js applications. Eventually both must consume the same versioned, independent REST API. See [architecture notes](docs/ARCHITECTURE.md).

## Order workflow details

See [Order workflows](docs/ORDER_WORKFLOWS.md) for fulfillment transitions, shipment previews, returns and refund limits. All workflows are simulated locally; no real carrier or payment actions occur.

## Catalog workflow details

See [Catalog workflows](docs/CATALOG_WORKFLOWS.md) for product variants, SKU validation, hierarchy and media reference behavior.

## Analytics & reports preview (Patch 07)

Open `/reports` for Sales & Orders, Product Performance, Inventory and Customer Insights. Date-range filters support all dates, latest 7/30 sample-order days and custom dates. Export the selected preview table as a CSV on your device. Reports are derived from browser-local records, **not real paid sales**. Verify calculations with `npm run verify:reports`. See [Reports preview contract](docs/REPORTS_PREVIEW.md).

## Compatibility alignment (Admin Patch 09)

The `/alignment` page compares the current browser-local Admin catalog to a **snapshot** of the customer Storefront's sample categories and products. The Product Editor includes new optional Storefront metadata and flexible color-only/size-only variants; legacy order lines can carry optional variant references. No IDs, selling prices, quantities or historical order details are auto-migrated. **Admin edits still do not publish to Customer Storefront.**

Run `npm run verify:alignment`, then `npm run check` and `npm run test:e2e:visual`. See `docs/COMPATIBILITY_PATCH09.md` for the unresolved backend decisions and mapping warnings.

## API integration status

Steps 1–2 are complete: live API transport, authentication, persistent sessions and route permissions. Domain APIs use Bearer JWT under `/v1`; a same-origin Next session endpoint handles login/refresh/logout cookies. Login survives reload, new tabs and browser restart until the session expires or is revoked. Refresh tokens use a persistent HttpOnly cookie; access tokens stay in memory. Catalog, shopping and checkout commerce source is connected; remaining business screens show an unavailable state in live mode; sample data is enabled only with `NEXT_PUBLIC_ESHOP_MODE=preview`. API errors never switch to fixtures.

Copy `.env.example` to `.env.local`, set the bare Backend origin and exact `ESHOP_APP_ORIGIN`, and start the Backend on port 4000. Use User port 3000 and Admin port 3001 (`npm run dev -- --port 3001`); configure Backend `CORS_ORIGINS` for the actual frontend origins. Production API origins require HTTPS. Restart Next after changing public environment values.

Run `npm run test:auth` for transport/session/bridge cases, `npm run check` for static/build validation and existing `test:e2e` commands for explicit-preview regressions. The Backend's guarded `npm run test:web:auth` runs the real cross-app auth suite against its isolated local test database. Full plan and auth rules are in sibling Backend `docs/WEB_INTEGRATION.md`, `docs/WEB_AUTH.md` and `contracts/web-integration.v1.json`. Real SMTP/provider and complete product acceptance remain separate.

## Catalog integration source status

Catalog/category/product/variant/media/inventory integration source is implemented; full runtime validation is pending. User shop/category/product pages use canonical public API data and real metadata. Admin category/product/variant editors, `/media` and inventory use Backend records with current-grant write controls. No fixture IDs are imported; explicit preview remains separate. Cart and other business features remain scheduled.

New test code is prepared but not executed under the owner's defer-until-final policy. Intermediate commands are `npm run typecheck`, `npm run lint` and `npm run build`; inspect combined scripts before execution. During final acceptance use `npm run test:unit` for all adapter/auth/upload/access cases, existing preview E2E and the Backend's guarded `test:web:integration` for real cross-app flows. See sibling Backend `docs/WEB_CATALOG.md` for source scope, API additions, retry rules and limitations. Earlier auth test PASS counts describe their historical tested snapshot.

## Account/cart integration source status

Account profile/addresses, the guest/customer cart and explicit login merge, owned wishlist and read-only Admin customer directory are implemented in source. Guest capability uses a separate HttpOnly same-origin cookie with the Backend's fixed 14-day expiry; it is never imported into preview stores or exposed in browser JSON. Cart mutations retain absolute quantities for explicit safe retries; checkout/shipping/tax/coupons and TEST payment source are now implemented; runtime validation remains deferred.

New test code is prepared but execution is deferred until all remaining implementation work finishes. Typecheck/lint/build are the intermediate checks. See sibling Backend `docs/WEB_SHOPPING.md` for ownership, CSRF, conflict reconciliation, directory privacy, final-window commands and source-validation limits. No new environment setting or application dependency is needed beyond the existing trusted API/exact app origins and Next runtime.

## Checkout source delivery (2026-11-08)

Customer checkout uses owned saved-address snapshots, configured country/currency delivery and coupon estimates, expiring stock holds, idempotent unpaid order creation and explicit TEST payment actions. Reload/lost responses recover through owned server discovery. Admin policies follow OWNER-only checkout rate/zone guards, marketing revision/limit rules and payment-report permissions. No live card details or browser PAID flags. Test code is prepared; suites run together at final integration validation. Typecheck, lint and builds are the intermediate checks. See Backend `docs/WEB_CHECKOUT.md`.

## Order operations source delivery (2026-11-08)

Owned history/detail, unpaid cancellation, customer return requests/withdrawal and authenticated UUID tracking are connected. Admin uses server pagination/exact UUID lookup, one-shipment fulfillment, inspection/restock, same-SKU replacements and OWNER-only refund request/history. Refund approval is not provider success or stock return; uncertain keyed actions retain UUID/body for explicit retry/reconciliation. Typecheck/lint/build are intermediate checks; all automated suites remain deferred to final integration validation. See Backend `docs/WEB_ORDERS.md`.

## Store/workspace source delivery (2026-11-08)

Step 7 source connects published homepage/collections/policies/branding and OWNER settings/staff/templates, current-grant dashboard/reports/audit/CSV, owned inbox/preferences/browser push and rich campaign/operations panels. Firebase 13.2.0 is pinned and lazily used only with public app/VAPID configuration and explicit prior browser consent. Auth credentials remain in the existing memory/HttpOnly session design. Actual Firebase/SMTP/FCM/provider/deployment acceptance remains separate. All automated suites are deferred to step 8; current type/lint/build/schema audits are intermediate checks. See Backend `docs/WEB_WORKSPACE.md`.
