# eShop admin architecture

## Boundaries

- `app/(admin)/`: Admin page routes
- `components/layout/`: shared responsive navigation and shell
- `components/admin/`: commerce workflow screens
- `components/ui/`: reusable presentation primitives
- `lib/fixtures.ts`: fictional seed products, categories, customers and orders
- `lib/store.ts`: client-only preview state and localStorage persistence
- `lib/types.ts`: current frontend domain models
- `design/tokens.json`: color and spacing references matching the customer storefront
- `e2e/`: browser-level behavioral tests

## Planned backend contract (not implemented)

The future independent backend will own product definitions and variants, image storage, nested categories, tax and shipping zones, inventory movements, customer accounts, orders, payments, refunds, permissions and audit logs. Administrator authentication and RBAC must be enforced on the server, not solely hidden by the UI.

API data should be authoritative for USD pricing, stock counts, payment state and order transitions. Stripe test-mode activities must only be performed via secure server endpoints and verified webhook processing after the backend phase begins.

## Currency and locale

Language: English. Display currency: USD. International shipping addresses use countries and regions without separate market-specific storefronts. Categories remain configurable rather than hardcoded for production.

## Preview data safety

Local browser storage is only for UI testing. It cannot be used to simulate secure authentication or transactional guarantees. Clearing browser storage removes changes.
