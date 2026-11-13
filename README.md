# eShop Admin

One authenticated API-backed workspace, using the approved pre-Backend design. The temporary sample-data mode, duplicate rendering paths, local mock store and old mock-only tests are removed. All pages use existing Backend APIs and current permissions.

Node 24 and npm are required. Install with `npm install --include=dev`, configure the existing API/app origin variables, then run `npm run dev`. Never commit credentials. The existing `.env.example` local change was preserved; the retired mode variable has no runtime effect.

The shared shell, blue theme, headings, cards, badges, tables and dialogs define the design for existing and future features. Dashboard metrics and chart read existing reporting endpoints; unavailable data is shown explicitly. No fabricated trend, cross-currency sum or client-owned financial state is introduced.

Products retain categories, canonical prices, variants and verified media. Inventory, orders, returns, refunds, customers, shipping, promotions, content, staff, settings, reports, notifications and messaging retain their current API handlers and permission/revision/idempotency rules.

Validation commands:

```powershell
npm run verify
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e -- --api-origin https://api.example.test
```

The browser runner builds production code and intercepts session and domain requests with API-shaped test data. The supplied origin is a test build value; tests do not mutate an actual Backend. For local interactive work use the trusted configured Backend origin. Build variables are passed to the child process without rewriting `.env`.

See [consolidation record](docs/ADMIN_CONSOLIDATION_2026-11-13.md), [architecture](docs/ARCHITECTURE.md) and [browser guide](E2E_TEST_GUIDE.md). Older preview workflow documents describe historical prototypes and do not define current API behavior. No commit, push or deployment is implied by local validation.
