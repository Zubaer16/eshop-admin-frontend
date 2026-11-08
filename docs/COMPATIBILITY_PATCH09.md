# eShop Admin — Compatibility Patch 09

**Status:** Frontend-only alignment draft. No live Storefront sync, no API, no database migration, no payment/stock authority.

**Inputs reviewed:**

- `kookaburra-admin-full-20261019-104026.zip`
- `kookaburra-storefront-full-20261018-214154.zip`

## Implemented in Admin

1. `/alignment` compares 7 public category slugs and 11 storefront sample products with the current **browser-local** Admin preview.
2. Suggested fixture associations are **not approved identity mappings**. Product IDs, variant IDs, sample prices, quantities and names have **not** been rewritten. Mismatched Lamp vs Halo remains explicitly _unconfirmed_.
3. Missing category rows can be added through the existing Admin category action. This is additive and does not reset, merge or rename saved categories; product category assignments remain unchanged.
4. Product editor now records optional storefront slug, description, compare-at USD, badge and tag. New/edited product slug is normalized, and duplicate effective slugs are blocked.
5. Product variant validation supports `size + color`, `size only`, or `color only`. SKU and inventory must be valid, and duplicate option combinations remain blocked.
6. Admin order line type can hold `variantId`, `sku` and `optionSnapshot` (optional for backward compatibility). Existing sample orders are **not** backfilled with guessed variants. Product detail shows missing variant identity for relevant old lines.
7. `lib/compatibility-contract.ts` exposes pure _draft projection_ helpers and version-1-shaped DTOs mirroring selected fields in the existing Storefront `lib/api/contracts.ts`. **This is not a generated/shared package** and not proof of full DTO parity.
8. `npm run verify:alignment` checks local draft projection behavior without a running server.

## Contract decisions required before backend

| Area        | Draft rule                                                                    | Remaining decision                                                                                |
| ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Identity    | Keep existing Admin/Storefront IDs unchanged                                  | Approve explicit stable canonical product/variant mapping; no name-based ID matching              |
| Money       | Use integer `amountMinor` USD, never browser float as settlement authority    | Rounding/tax/discount rules and server quotes                                                     |
| Variants    | `{id, sku, options, available}` with flexible option keys                     | Stable IDs, unique SKU, default/simple variant behavior and reservations                          |
| Orders      | `variantId` nullable only in legacy previews; capture SKU and option snapshot | Require variant selection for real purchasable lines; order price/tax/discount/shipping snapshots |
| Categories  | Slug compares customer categories; Admin keeps nested `parentId`              | Canonical UUIDs/parent rules, placement of Lifestyle and Tote                                     |
| Publication | No cross-frontend localStorage sharing                                        | Public API projection for products, banners, collections and coupons                              |
| Shipping    | `standard` / `express` named options remain                                   | ISO country-code policy, eligibility, thresholds, tax correctness                                 |
| Security    | Admin previews only                                                           | Authenticated session and backend enforced RBAC/audit                                             |
| Payments    | No real payments/refunds                                                      | Stripe sandbox integration after backend approval and authoritative server quote                  |

## Compatibility review usage

- Open `/alignment` and examine category gaps, product fixture candidates, incomplete metadata and sample legacy order items.
- Add the missing `Lifestyle` category if desired; it only changes local Admin preview.
- In `/products`, edit catalog metadata and create color-only variants when needed. This **does not create a matching Storefront variant**.
- Review the _Draft API-shaped product projection_. The `id` remains a local preview ID, and missing text/media are never fabricated.
- Export/approve a product mapping **outside** the frontend before any DB migration. Do not silently choose a catalog's USD price or stock as canonical.

## Verification

```powershell
npm run verify:alignment
npm run check
npm run test:e2e:visual
```

Existing Admin tests remain; Patch 09 adds four Playwright journeys. Default 900 ms visual action pause remains.

## Explicit non-goals

Not part of this patch: editing Customer Storefront sources, merging localStorage across separate apps, importing fixture prices as production prices, inventing `variantId` on old orders, real auth, real Stripe, checkout/quote computation or starting a backend. **Next:** Customer storefront adapter alignment (Patch 09C) after the Admin patch passes verification.
