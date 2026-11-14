> Historical prototype/design reference. The runtime preview workspace and its tests were retired on 2026-11-13. See [current consolidation](ADMIN_CONSOLIDATION_2026-11-13.md) for the API-backed workspace.

# Admin UI & accessibility QA — Patch 08

## Tax removal and optional delivery defaults - 2026-11-14

The owner requested removal of checkout tax and a delivery charge of zero when no amount is configured. New checkout estimates and reservations use taxMinor 0. Tax configuration fields and tax_bps columns are removed. Existing order and reservation tax snapshots retain their recorded amounts, including frozen payment retries.

Delivery pricing resolves an enabled country/currency override, then a per-currency default, then zero. A disabled country override falls through to the currency default. Missing country policy permits checkout. Delivery zones continue to define configured service prices and availability. An explicit standard selection works with the fallback price. Express requires a configured service.

OWNER-only GET and PUT /v1/admin/checkout/defaults manage currency, shippingMinor, an optional freeOverSubtotalMinor and expectedRevision. Revision checks protect concurrent changes and updates are audited. Admin Delivery settings contains currency defaults and optional country rates. A blank delivery amount saves as zero. Tax inputs are removed.

Storefront automatically applies a single delivery service and retains selection when several services are available. Checkout omits the Tax row. Order receipts show positive historical tax amounts. Browser-local Zustand cart behavior and final server price validation with atomic stock reservation remain in place.

Migrations 20261114153000_checkout_default_rates and 20261114160000_remove_checkout_tax_configuration are applied only to the guarded local test database. The second migration follows the owner's tax-removal clarification. Local audit verified 44 applied migrations with 44 matching checksums, zero unresolved failures and zero pending migrations. Both rate tables have no tax_bps columns. Historical order and reservation tax columns remain.

Source changes await commit/push and application deployment. Both new live migrations remain pending. Real external Stripe provider, webhook and worker acceptance remains pending.

### Executed local validation

- Backend build, Prisma validation, type checks and lint passed. Unit tests passed 347, Jest HTTP tests 13, API smoke/contract tests 62, isolated database tests 84 and security tests 67. The final focused Stripe gateway run passed all 9 tests and preserves the existing provider request shape.
- Admin build, type checks, lint and verification passed with 48 unit tests and 25 production-browser tests. Browser coverage includes creating a currency default and editing its delivery amount to blank, which saves zero.
- Storefront build, type checks, lint and verification passed with 57 unit tests and 33 production-browser tests. Tax-free checkout presentation is covered.
- Four real local backend/admin/storefront browser integration tests passed. They cover OWNER default configuration, country delivery pricing, coupon totals, account isolation and reservation recovery.
- OpenAPI has 154 paths and 195 operations. Alignment audit reports 7 MATCH, 15 ADAPTER and zero REVIEW, with 4 audit-tool tests passing.

## Purpose

This patch improves interaction and keyboard accessibility in the **frontend-only** eShop administration preview. It is **not** a completed accessibility conformance audit or production readiness certification.

## Implemented

- Visible-on-focus **Skip to main content** link to `main#main-content`.
- Mobile sidebar as a Radix dialog: focus contained while open, Escape closes, focus returned to trigger, labelled navigation. Existing menu links and sample-data reset remain available.
- Searchable **Jump to section** dialog with **Ctrl+K**/**Command+K**, result filtering, ArrowUp/ArrowDown, Enter to navigate, Escape to close and clear empty-state feedback. Available on phone and desktop widths.
- Reports tabs use a single active keyboard tab stop and support ArrowLeft, ArrowRight, Home and End.
- All existing data tables with horizontal overflow expose keyboard-focusable labelled scroll regions.
- Product/editor dialogs respect small dynamic viewports and have less cramped mobile padding.
- Playwright scenarios verify these interactions with the existing visual delay of 900 ms per recorded action.

## Manual acceptance list

1. Test navigation and report tabs with **keyboard only** on desktop; check focus is visible and no focus is stranded behind a dialog.
2. Check product editor at 320, 375, 390, 768 and 1120px widths and at enlarged browser text. Some dense inventory and reporting tables intentionally scroll horizontally.
3. Check both mobile drawer and quick-navigation results with a screen reader; confirm dialog name, announcements and result navigation.
4. Use high zoom, reduced motion and Windows high-contrast settings; verify the preview remains operable.
5. Run `npm run check`, `npm run verify:ui` and `npm run test:e2e:visual` locally. Automated coverage is not a substitute for manual accessibility testing.
6. Before backend work, reconcile the Admin vs Storefront catalog, variant, category, shipping, order and payment DTOs documented in `docs/CROSS_FRONTEND_ALIGNMENT.md`.

## Constraints

The preview still stores data only in the browser and does **not** enforce real authorization, process payments, or publish catalog or promotions to the customer storefront. Do **not** deploy it to production as an authenticated administrative system. No new dependencies were introduced in Patch 08.
