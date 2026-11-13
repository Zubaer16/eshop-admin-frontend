# Admin architecture

## One connected presentation

App Router pages render one feature each. Authentication restores the existing secure session; WorkspaceBoundary checks current grants. There are no mode branches or sample-data fallbacks. Domain API transport, DTOs, permissions and actions remain in their existing modules.

`components/layout` owns the shared sidebar/header/navigation and PageHeading. `components/ui` owns the original theme primitives, Panel, Badge, Button, Field and Modal. RecordDetails renders server records as labelled cards, status badges and scrollable tables with complete expandable details; it does not invent values or grant access.

Dashboard reads existing overview and daily-report APIs. Financial amounts retain exact integer strings and currency precision. Daily chart coordinates use bounded BigInt ratios for display, not authoritative financial arithmetic. Missing summaries remain unavailable, and the recent-order count is explicitly a bounded latest-record count.

Feature components in catalog, commerce, orders, customers, management and notifications retain the existing business handlers. New fields and features must use these shared design primitives and current Backend contracts. Preserve revision checks, frozen retry IDs, uncertain-write guards, canonical identities, owner restrictions, provider scopes and stock/financial authority.

Tests are API-shaped browser fixtures outside application source plus the retained real transport/security/contract unit tests. Mock workspace files and their preview-only suites have been deleted. External/provider/deployed acceptance is separate from local presentation validation.
