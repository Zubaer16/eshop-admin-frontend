> Historical prototype/design reference. The runtime preview workspace and its tests were retired on 2026-11-13. See [current consolidation](ADMIN_CONSOLIDATION_2026-11-13.md) for the API-backed workspace.

# Reports preview contract (Patch 07)

- Source: browser-local `orders`, `products`, `customers` and `stockEvents` held in the existing Zustand store. There is **no server query or payment verification**.
- All monetary displays and exports use **USD**. No currency or language selector.
- Date range selects orders by `createdAt` **inclusive**. Latest 7/30 days are anchored to the latest _sample order date_ rather than today's date, so test data stays demonstrable. Custom dates are user-defined.
- Booked order value = sum of item price × quantity for non-cancelled orders within the date range. Includes Pending and therefore **is not paid revenue**.
- Refund preview total = the sum of locally recorded order refund preview entries on non-cancelled orders. These entries do **not** reflect real Stripe refunds.
- Average order value = non-cancelled booked order value ÷ non-cancelled order count (zero when no qualifying orders).
- Product units/order value = item quantities and original item prices on eligible non-cancelled orders in the selected date range. Product rows include unsold products and retain archived IDs found on orders.
- Inventory stock is a **current snapshot**, with variant stock summed where variants exist; low stock is 1–9, out of stock is 0. Inventory is not filtered by order date.
- Customer directory is a **current snapshot**, with order count/value limited to qualifying order dates. Repeat customer means 2+ qualifying orders, not necessarily 2 paid orders.
- CSV files contain the currently selected report tab; sales rows follow the date filter. Exports stay local and guard cell values that might be interpreted as spreadsheet formulas.
- Excluded: taxes, shipping, discounts, profit, acquisition cost, settlement status, cohort retention, actual payment statuses, reconciliation and financial forecasting. These require authoritative backend data and agreed reporting definitions.
