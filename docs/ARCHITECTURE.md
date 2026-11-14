# Admin architecture

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

## One connected presentation

App Router pages render one feature each. Authentication restores the existing secure session; WorkspaceBoundary checks current grants. There are no mode branches or sample-data fallbacks. Domain API transport, DTOs, permissions and actions remain in their existing modules.

`components/layout` owns the shared sidebar/header/navigation and PageHeading. `components/ui` owns the original theme primitives, Panel, Badge, Button, Field and Modal. RecordDetails renders server records as labelled cards, status badges and scrollable tables with complete expandable details; it does not invent values or grant access.

Dashboard reads existing overview and daily-report APIs. Financial amounts retain exact integer strings and currency precision. Daily chart coordinates use bounded BigInt ratios for display, not authoritative financial arithmetic. Missing summaries remain unavailable, and the recent-order count is explicitly a bounded latest-record count.

Feature components in catalog, commerce, orders, customers, management and notifications retain the existing business handlers. New fields and features must use these shared design primitives and current Backend contracts. Preserve revision checks, frozen retry IDs, uncertain-write guards, canonical identities, owner restrictions, provider scopes and stock/financial authority.

Tests are API-shaped browser fixtures outside application source plus the retained real transport/security/contract unit tests. Mock workspace files and their preview-only suites have been deleted. External/provider/deployed acceptance is separate from local presentation validation.
