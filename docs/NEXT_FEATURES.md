> Historical prototype/design reference. The runtime preview workspace and its tests were retired on 2026-11-13. See [current consolidation](ADMIN_CONSOLIDATION_2026-11-13.md) for the API-backed workspace.

# Admin frontend roadmap

This repository intentionally starts with a polished, testable frontend foundation. Subsequent frontend work, **before backend implementation**, includes:

1. **Implemented frontend previews:** size/color/SKU product variants, stock adjustment per variant, image references, nested category management and field validation. Remaining: real media uploads, bulk actions and publishing governance.
2. **Implemented frontend preview:** order details, shipment references, activity timeline, guarded status transitions, reasoned cancellation, return decisions, capped refund records. Remaining: real carrier integrations, financial settlement, per-line return eligibility and server audit enforcement.
3. **Implemented frontend previews:** coupons, campaigns, hero banners and featured collections. Shipping zones/rates, illustrative tax settings and read-only payment reporting are now frontend previews. Remaining: real storefront publishing, tax compliance, shipping providers and verified payment reconciliation once a backend exists.
4. **Implemented frontend previews:** staff directory, visual role permission matrix, store settings, and limited local activity history. Remaining: real account invitations, authentication, backend RBAC and tamper-resistant audit trail.
5. Accessibility, keyboard navigation, mobile/tablet layouts, error/empty/loading states and exhaustive Playwright E2E coverage.
6. Final design QA and acceptance. Only then start backend work with explicit user authorization.

Shared-store backend and real Stripe sandbox payments are **not implemented** in the current frontend.
