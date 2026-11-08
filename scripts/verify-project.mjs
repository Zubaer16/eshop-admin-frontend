import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const must = [
  'app/layout.tsx',
  'app/(admin)/dashboard/page.tsx',
  'app/(admin)/products/page.tsx',
  'app/(admin)/categories/page.tsx',
  'app/(admin)/inventory/page.tsx',
  'app/(admin)/orders/page.tsx',
  'app/(admin)/customers/page.tsx',
  'components/admin/dashboard.tsx',
  'components/admin/products.tsx',
  'components/admin/categories.tsx',
  'components/admin/inventory.tsx',
  'components/admin/orders.tsx',
  'components/admin/order-details.tsx',
  'lib/order-workflow.ts',
  'e2e/03-order-workflows.spec.mjs',
  'docs/ORDER_WORKFLOWS.md',
  'scripts/verify-orders.mjs',
  'components/admin/customers.tsx',
  'components/admin/shipping.tsx',
  'components/admin/payments.tsx',
  'app/(admin)/shipping/page.tsx',
  'app/(admin)/payments/page.tsx',
  'lib/commerce-policy.ts',
  'lib/payment-report.ts',
  'e2e/05-shipping-payments.spec.mjs',
  'scripts/verify-commerce.mjs',
  'docs/SHIPPING_PAYMENT_PREVIEWS.md',
  'components/admin/promotions.tsx',
  'components/admin/store-content.tsx',
  'app/(admin)/promotions/page.tsx',
  'app/(admin)/content/page.tsx',
  'lib/merchandising.ts',
  'e2e/04-merchandising.spec.mjs',
  'scripts/verify-merchandising.mjs',
  'lib/store.ts',
  'lib/workspace-policy.ts',
  'components/admin/staff.tsx',
  'components/admin/settings.tsx',
  'components/admin/activity.tsx',
  'app/(admin)/staff/page.tsx',
  'app/(admin)/settings/page.tsx',
  'app/(admin)/activity/page.tsx',
  'e2e/06-workspace-management.spec.mjs',
  'scripts/verify-workspace.mjs',
  'docs/WORKSPACE_PREVIEWS.md',
  'lib/types.ts',
  'components/layout/quick-navigation.tsx',
  'e2e/08-ui-quality.spec.mjs',
  'docs/ADMIN_UI_QA.md',
  'scripts/verify-ui.mjs',
  'app/(admin)/reports/page.tsx',
  'app/(admin)/alignment/page.tsx',
  'components/admin/alignment.tsx',
  'lib/compatibility-contract.ts',
  'scripts/verify-alignment.mjs',
  'docs/COMPATIBILITY_PATCH09.md',
  'components/admin/reports.tsx',
  'lib/reporting.ts',
  'scripts/verify-reports.mjs',
  'e2e/07-reports.spec.mjs',
  'playwright.config.mjs',
  'e2e/01-admin-workspace.spec.mjs',
  'e2e/02-catalog-advanced.spec.mjs',
  'lib/catalog.ts',
  'components/admin/product-form.tsx',
]
const missing = must.filter((file) => !existsSync(join(process.cwd(), file)))
if (missing.length) {
  console.error('Missing expected files:', missing)
  process.exit(1)
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
if (pkg.name !== 'eshop-admin-frontend' || !pkg.scripts['test:e2e:visual']) {
  console.error('Package scripts missing')
  process.exit(1)
}
const source = [
  ...readdirSync('app', { withFileTypes: true }).map((i) => i.name),
]
if (!source.length) {
  process.exit(1)
}
console.log(
  `eShop Admin project structure OK (${must.length} required files checked). This is not a production build.`,
)
