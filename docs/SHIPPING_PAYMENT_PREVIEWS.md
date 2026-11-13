> Historical prototype/design reference. The runtime preview workspace and its tests were retired on 2026-11-13. See [current consolidation](ADMIN_CONSOLIDATION_2026-11-13.md) for the API-backed workspace.

# Shipping, taxes and payments — frontend-only contract notes

## Cross-frontend review (18 October 2026)

Customer Storefront `lib/checkout-preview.ts` supports:

- English UI and USD-only sample amounts;
- `standard` delivery: **$18** example fee;
- `express` (international priority): **$35** example fee;
- 9 example destination choices: United States, United Kingdom, Canada, Australia, United Arab Emirates, Singapore, Malaysia, India, and Other country;
- address → delivery → review; final payment/order submission is disabled.

Admin Patch 05 uses the **same method IDs** (`standard`, `express`) and **same destination names** in its editable preview. Admin default zone uses $18/$35 sample fees. This is **manual contract alignment**, not cross-app synchronization.

## Draft Admin policies

`/shipping` holds local-only zones, enabled services, flat USD example fees, free-above thresholds, optional delivery notes and illustrative destination tax percentages. Exact country ownership is limited to one zone; an optional `Other country` zone serves as example fallback. Country choices are demonstration values, NOT verified serviceability, shipping quotes or import-tax jurisdictions.

Tax preview calculates _sample subtotal × illustrative percentage_ only. It does not calculate jurisdiction-specific sales/VAT tax, customs, duties, exemptions, shipping-taxability, or real totals. The calculator explicitly labels totals **excluding tax**.

`/payments` presents fictional sample rows derived from Admin order fixtures. Sample statuses are static, independent of order state, order return/refund preview and any payment processor. The sample IDs do not represent Stripe transaction IDs or authorization outcomes. This page is read-only; there are no card fields, capture buttons, Stripe SDKs, API keys or webhook handlers.

## Backend contract for future approval

Future shared versioned APIs must establish:

1. Destination country eligibility, carrier/method availability, rate currency and server-signed short-lived checkout quotes;
2. Shipping/tax jurisdiction and duty calculations according to verified laws, including region/postal level where relevant;
3. Authoritative product/variant prices, discount stacking rules, inventory reservation and shipping-taxability;
4. Stripe test-mode Checkout Sessions with server secrets, signed webhooks, idempotency, refunds/reconciliation and RBAC-protected payment operations;
5. Admin management/publishing audit trails, roles, approval workflows and live Storefront/Flutter parity.

Stripe merchant eligibility in the eventual operating jurisdiction must be checked separately. Neither frontend currently supplies a real payment backend. Do not publish this Admin preview as a live merchant dashboard.

## Persistence

The existing localStorage key `kookaburra-admin-local-preview-v1` is unchanged. New `shippingZones` and `taxRules` arrays are merged using defaults when opening previously saved preview data, and reset together with other preview records using **Reset sample data**. No existing orders or catalog records are migrated or rewritten.
