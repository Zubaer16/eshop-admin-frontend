> Historical prototype/design reference. The runtime preview workspace and its tests were retired on 2026-11-13. See [current consolidation](ADMIN_CONSOLIDATION_2026-11-13.md) for the API-backed workspace.

# Cross-frontend source audit — Admin vs Storefront

Checked supplied Admin ZIP `kookaburra-admin-full-20261018-211845(1).zip` and supplied Customer Storefront ZIP `kookaburra-storefront-full-20261018-214154.zip`, dated 18 October 2026.

## Already aligned

| Concern                    | Admin Patch 05                                | Customer Storefront                     | Current finding                           |
| -------------------------- | --------------------------------------------- | --------------------------------------- | ----------------------------------------- |
| Language                   | English                                       | English                                 | Aligned                                   |
| Display currency           | USD                                           | USD                                     | Aligned                                   |
| Checkout method IDs        | `standard`, `express`                         | `standard`, `express`                   | Aligned preview contract                  |
| Example base shipping fees | $18 and $35                                   | $18 and $35                             | Aligned default examples (not synced)     |
| Example countries          | Nine shared names in `lib/commerce-policy.ts` | Nine names in `lib/checkout-preview.ts` | Aligned strings (not service eligibility) |
| Real payment processing    | Disabled, simulated report only               | Disabled, preview only                  | Both intentionally offline                |

## Important mismatches to resolve before the backend phase

- Product identifiers differ: Admin headphone is `p-101`; Storefront headphone is `p-headphones`. Other product IDs also differ.
- Category IDs differ: Admin uses e.g. `cat-electronics`; Storefront uses `electronics`. Category offerings are not identical, and Admin supports nested categories.
- Product records differ: Storefront products have `slug`, `title`, image gallery (`src`/`alt`), and option-based variants; Admin products have `name`, `categoryId`, `images` with `url`/`alt`, and `size`/`color`/`sku` variants. They need a shared canonical DTO schema and stable identifiers.
- Variant options differ: Storefront may have many size/color combinations; Admin sample inventory for sneakers covers only a subset. Current previews cannot be considered synchronized stock.
- Storefront checkout does not consume Admin shipping/tax policy. It uses static sample rates; a future server-side pricing/eligibility API must unify these.
- Admin reporting has fictional sample payment statuses; Storefront has no completed real orders or payments. Do not infer actual checkout metrics from Admin sample rows.
- Admin coupons and banners are not published to Storefront and cannot be validated end to end before the shared backend exists.

## Recommended follow-up

Before building shared backend APIs, write a single versioned OpenAPI contract for catalog IDs/slugs, category hierarchy, variants, images, address schema, country eligibility, price/tax/shipping quote, orders, payment state and refunds. Preserve both frontend UX flows and convert their local fixtures deliberately; do **not** silently assume Admin sample IDs match Storefront IDs.
