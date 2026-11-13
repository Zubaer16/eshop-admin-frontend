import { test, expect } from '@playwright/test'
const id = '00000000-0000-4000-8000-000000000001'
const user = {
  id,
  email: 'owner@example.test',
  role: 'OWNER',
  staffRole: null,
  permissions: [],
}
const product = {
  id,
  title: 'Connected product',
  slug: 'connected-product',
  sku: 'SKU-001',
  description: '',
  status: 'ACTIVE',
  currency: 'USD',
  priceMinor: 2599,
  compareAtMinor: null,
  stockOnHand: 12,
  hasVariants: false,
  variants: [],
  categoryIds: [id],
  gallery: [],
  purchasable: true,
  badge: 'Featured',
  tag: null,
}
const pageOf = (items) => ({
  items,
  page: 1,
  limit: 20,
  total: items.length,
  pages: 1,
})
const overview = {
  window: {},
  available: {
    financial: true,
    orders: true,
    inventory: true,
    catalog: true,
    customers: true,
  },
  financial: {
    byCurrency: [
      {
        currency: 'USD',
        paidMinor: '900719925474099301',
        refundedMinor: '0',
        netCollectedMinor: '900719925474099301',
        paidOrderCount: 1,
      },
    ],
    placedOrdersByCurrentStatus: [],
  },
  recentOrders: [],
  inventory: [
    { currency: 'USD', availableUnits: '12', skuCount: 1, lowStockCount: 0 },
  ],
  products: 1,
  activeProducts: 1,
  customers: 4,
}
async function connect(page, identity = user) {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      json: {
        accessToken: 'a'.repeat(40),
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: identity,
      },
    }),
  )
  await page.route('**/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname
    let data
    if (path === '/v1/admin/auth/me') data = identity
    else if (path === '/v1/admin/dashboard/overview') data = overview
    else if (path === '/v1/admin/reports/daily')
      data = {
        items: [
          { date: '2026-11-12', netCollectedMinor: '100' },
          { date: '2026-11-13', netCollectedMinor: '200' },
        ],
      }
    else if (path === '/v1/admin/products') data = pageOf([product])
    else if (path === '/v1/admin/categories')
      data = [{ id, name: 'Clothing', slug: 'clothing', parentId: null }]
    else if (path === '/v1/admin/orders')
      data = pageOf([
        {
          id,
          status: 'PAID',
          currency: 'USD',
          totalMinor: 2599,
          createdAt: '2026-11-13T00:00:00Z',
          fulfillment: null,
        },
      ])
    else if (path === '/v1/admin/notifications') data = pageOf([])
    else
      return route.fulfill({
        status: 503,
        json: { message: 'Controlled unavailable response' },
      })
    return route.fulfill({ json: data })
  })
}
test('connected dashboard retains cards, chart and exact financial values', async ({
  page,
}) => {
  await connect(page)
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Good to see you again.' }),
  ).toBeVisible()
  await expect(
    page.getByText('$9,007,199,254,740,993.01').first(),
  ).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'Daily net collections in USD' }),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/admin/dashboard.png',
    fullPage: true,
  })
})
test('products use original table style with connected data and edit dialog', async ({
  page,
}) => {
  await connect(page)
  await page.goto('/products')
  await expect(
    page.getByRole('cell', { name: 'Connected product SKU-001' }),
  ).toBeVisible()
  await expect(page.locator('.admin-table th')).toHaveCount(8)
  await expect(
    page.getByRole('cell', { name: '$25.99', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Edit product' })).toBeVisible()
  await expect(page.getByLabel('Product title')).toHaveValue(
    'Connected product',
  )
  await expect(page.getByLabel('Price (USD)', { exact: true })).toHaveValue(
    '25.99',
  )
})
test('orders retain connected payment and shipment table', async ({ page }) => {
  await connect(page)
  await page.goto('/orders')
  await expect(page.getByRole('region', { name: 'Orders table' })).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'PAID', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Not started' })).toBeVisible()
})
for (const width of [320, 390, 768, 1440])
  test(`dashboard and catalog contain scrolling at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 })
    await connect(page)
    for (const path of ['/dashboard', '/products', '/orders']) {
      await page.goto(path)
      if (path === '/dashboard')
        await expect(
          page.getByRole('img', { name: 'Daily net collections in USD' }),
        ).toBeVisible()
      else await expect(page.locator('.admin-table').first()).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        path,
      ).toBe(true)
    }
  })
test('server failure offers retry without fabricated data', async ({
  page,
}) => {
  await connect(page)
  await page.goto('/inventory')
  await expect(page.getByRole('alert').first()).toBeVisible()
  await expect(
    page.getByRole('button', { name: /retry/i }).first(),
  ).toBeVisible()
})
test('restricted staff cannot open owner workspace', async ({ page }) => {
  await connect(page, {
    ...user,
    role: 'STAFF',
    staffRole: 'SUPPORT',
    permissions: [],
  })
  await page.goto('/staff')
  await expect(
    page.getByRole('heading', { name: /access|permission|unavailable/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Create staff account' }),
  ).toHaveCount(0)
})

test('editing preserves the existing endpoint, currency and minor-unit payload', async ({
  page,
}) => {
  await connect(page)
  let submitted
  await page.route('**/v1/admin/products/' + id, async (route) => {
    if (route.request().method() === 'PATCH')
      submitted = route.request().postDataJSON()
    await route.fulfill({ json: product })
  })
  await page.goto('/products')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Price (USD)', { exact: true }).fill('30.01')
  await page.getByRole('button', { name: 'Save product', exact: true }).click()
  await expect.poll(() => submitted?.priceMinor).toBe(3001)
  expect(submitted).toEqual({
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    description: '',
    status: 'ACTIVE',
    currency: 'USD',
    priceMinor: 3001,
    compareAtMinor: null,
    categoryIds: [id],
    badge: 'Featured',
    tag: null,
  })
})

test('staff directory uses connected table and keeps owner immutable', async ({
  page,
}) => {
  await connect(page)
  await page.route('**/v1/admin/staff', (route) =>
    route.fulfill({
      json: [
        {
          id,
          name: 'Store owner',
          email: user.email,
          role: 'OWNER',
          status: 'ACTIVE',
          createdAt: '2026-11-13T00:00:00Z',
        },
      ],
    }),
  )
  await page.route('**/v1/admin/roles', (route) =>
    route.fulfill({
      json: [
        {
          key: 'OWNER',
          name: 'Owner',
          permissions: ['catalog.manage'],
          immutable: true,
        },
      ],
    }),
  )
  await page.goto('/staff')
  await expect(
    page.getByRole('region', { name: 'Staff members' }),
  ).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'ACTIVE', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Edit staff member' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Edit role grants' }),
  ).toHaveCount(0)
})

test('report table displays exact currency and retains complete record details', async ({
  page,
}) => {
  await connect(page)
  await page.route('**/v1/admin/reports/financial*', (route) =>
    route.fulfill({
      json: {
        window: { from: '2026-11-01', to: '2026-11-13' },
        byCurrency: [
          {
            currency: 'USD',
            paidMinor: '900719925474099301',
            refundedMinor: '0',
            netCollectedMinor: '900719925474099301',
            paidOrderCount: 1,
            refundCount: 0,
            extraField: 'Retained server detail',
          },
        ],
      },
    }),
  )
  await page.goto('/reports')
  await expect(
    page.getByRole('region', { name: 'Records table' }),
  ).toBeVisible()
  await expect(
    page.getByText('$9,007,199,254,740,993.01').first(),
  ).toBeVisible()
  await page.getByText('View details', { exact: true }).click()
  await expect(page.getByText('Retained server detail').last()).toBeVisible()
})

for (const path of [
  '/customers',
  '/shipping',
  '/payments',
  '/promotions',
  '/content',
  '/reports',
  '/media',
  '/staff',
  '/settings',
  '/activity',
  '/messaging',
  '/operations',
])
  test(`${path} retains shared workspace design and actionable API failure`, async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await connect(page)
    await page.goto(path)
    await expect(page.locator('main h1')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /retry/i }).first(),
    ).toBeVisible()
    expect(errors).toEqual([])
  })
