# Promotions and store content (local preview)

## Promotions

The **Promotions** page contains two separate editors:

- **Coupons**: unique code, percentage/fixed USD discount, minimum subtotal, optional discount cap, optional redemption limit, optional date range and optional category scope. The example calculator is a _UI-only estimate_: it does not enforce scheduling, track redemptions, or apply a discount to real orders.
- **Campaigns**: named promotional planning records with Draft, Scheduled, Active and Paused editor statuses and date validation. No schedule runs and "Active" does **not** publish anything to the customer storefront.

## Store content

- **Hero banners**: headline, subtitle, CTA label, safe internal route, optional HTTPS/local image reference, display position and preview visibility. No image upload occurs.
- **Featured collections**: title, description, ordered position, enabled flag and selected products. The editor requires at least one product. Removing a product from Catalog prunes its references; an emptied collection is marked hidden.

The two editors use browser `localStorage` (same eShop Admin preview store). Existing catalog/order data are preserved during hydration. **No customer-facing storefront pages, backend API, payment system, customer order or actual publishing integration is connected.** Do not use the preview for real commerce decisions.

## Verification

```powershell
npm run verify:merchandising
npm run check
npm run test:e2e:visual
```

Playwright tests simulate coupon creation/duplicate validation, campaign date rules, safe banner destinations, collection selection and local persistence, retaining the original ~900 ms visible action pacing.
