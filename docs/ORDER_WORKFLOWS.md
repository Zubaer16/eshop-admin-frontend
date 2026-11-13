> Historical prototype/design reference. The runtime preview workspace and its tests were retired on 2026-11-13. See [current consolidation](ADMIN_CONSOLIDATION_2026-11-13.md) for the API-backed workspace.

# Order management — frontend preview

The Orders area provides interactive _sample_ order management. Data is persisted to this browser's localStorage, not a server. Use **Reset sample data** to reset it. No shipping carrier API, customer notifications, real payments or Stripe refunds are executed.

## Allowed fulfillment transitions

- `Pending → Processing → Shipped → Delivered`.
- `Pending` or `Processing` can be cancelled with a reason of 5+ characters using **Cancel order**.
- `Delivered` and `Cancelled` are terminal fulfillment statuses. A delivered order can still receive a return request and preview refund.
- Shipment information can be added/edited while `Processing` or `Shipped`. Saving shipment details (carrier and tracking number required) advances `Processing → Shipped`.
- Shipment details saved for a `Shipped` order are displayed for later viewing.

## Return/refund preview

A delivered order may have one return request. Enter a reason of at least five characters, then approve or reject. Only an approved return allows a preview refund record. Multiple refund entries are allowed as long as the total never exceeds the order's stored product subtotal in USD. Notes are required for each entry. A refund entry is a local simulation, **not** a payment action.

There is no automatic restocking for cancellations or returns. Stock movements and actual refunds must eventually be implemented as audited backend operations with transaction boundaries and appropriate permissions.

## Data compatibility

Existing saved orders lack shipment, timeline, returnRequest and refunds. These are optional extensions to the existing order object and old preview data remains readable. New changes continue to use the existing `kookaburra-admin-local-preview-v1` storage key.

## Testing

```powershell
node scripts/verify-orders.mjs
npm run check
npm run test:e2e:visual
```

Playwright suite `e2e/03-order-workflows.spec.mjs` adds tests for forward-only status transitions, tracking persistence, reason-required cancellation, return approval/rejection, refund caps and invalid shipment inputs. The standard Playwright helper retains the 900ms action delay.

## Backend handoff (not implemented)

A future shared API must enforce staff RBAC, status-transition authorization, cancellation eligibility, stock reservation/release, carrier integration, full historical auditing, eligible return windows, per-item returns, tax/shipping-aware refund calculations, payment-provider idempotency and immutable financial records. This document is not a production policy.
