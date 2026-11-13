> Historical prototype/design reference. The runtime preview workspace and its tests were retired on 2026-11-13. See [current consolidation](ADMIN_CONSOLIDATION_2026-11-13.md) for the API-backed workspace.

# Workspace previews: staff, permissions and settings

Patch 06 adds three independent frontend-only sections:

- **Staff & roles** (`/staff`): sample staff CRUD, email deduplication, active/suspended state and fixed active sample owner. The permission matrix is editable for non-owner role templates. **It does not authorize any route or API.**
- **Store settings** (`/settings`): draft store name, support email, optional HTTPS website address, reporting timezone, future order prefix, support notice. English and USD are locked in this frontend. These settings are **not sent to the Customer Storefront**, and editing the order prefix does not rewrite existing orders.
- **Activity preview** (`/activity`): max 100 locally stored entries for staff, roles and settings changes. This is **not an authentication log or a tamper-resistant audit record**. Other catalog/order actions are not recorded in this local list.

Seed identities use reserved `.test` example email addresses. Do not enter actual staff identities or other secrets in localStorage. A browser reset or private browsing session can erase these previews. The shared backend must implement actual staff authentication, role permissions, owner protection, structured audit attribution and secure settings validation independently.

## Regression checks

```powershell
npm run verify:workspace
npm run check
npm run test:e2e:visual
```

The E2E suite has 26 scenarios (22 before Patch 06, 4 new), retaining 900 ms action pauses.
