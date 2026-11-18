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
    else if (path === '/v1/admin/products/' + id) data = product
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

test('authenticated workspace preloads only permission-authorized first-read resources', async ({
  page,
}) => {
  const requests = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/v1/admin/')) requests.push(url.pathname)
  })
  await connect(page)
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Good to see you again.' }),
  ).toBeVisible()
  await expect.poll(() => requests.includes('/v1/admin/categories')).toBe(true)
  await expect.poll(() => requests.includes('/v1/admin/orders')).toBe(true)
})

test('staff workspace preload skips sections without current permission', async ({
  page,
}) => {
  const requests = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/v1/admin/')) requests.push(url.pathname)
  })
  await connect(page, {
    ...user,
    role: 'STAFF',
    staffRole: 'SUPPORT',
    permissions: ['dashboard.view'],
  })
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Good to see you again.' }),
  ).toBeVisible()
  await expect.poll(() => requests.includes('/v1/admin/categories')).toBe(true)
  expect(requests).not.toContain('/v1/admin/orders')
  expect(requests).not.toContain('/v1/admin/staff')
})

test('shipping configuration is not speculatively loaded for non-owner staff', async ({
  page,
}) => {
  const requests = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/v1/admin/')) requests.push(url.pathname)
  })
  await connect(page, {
    ...user,
    role: 'STAFF',
    staffRole: 'SHIPPING',
    permissions: ['shipping.manage'],
  })
  await page.goto('/shipping')
  await expect(
    page.getByText(
      /Only the store owner can read or configure default charges/,
    ),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Shipping & taxes' }).hover()
  await page.waitForTimeout(150)
  expect(requests).not.toContain('/v1/admin/checkout/rates')
  expect(requests).not.toContain('/v1/admin/checkout/zones')
  expect(requests).not.toContain('/v1/admin/checkout/defaults')
})

test('product detail data preloads on keyboard focus without opening the dialog', async ({
  page,
}) => {
  const requests = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/v1/admin/')) requests.push(url.pathname)
  })
  await connect(page)
  await page.goto('/products')
  await expect(
    page.getByRole('cell', { name: 'Connected product SKU-001' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Details', exact: true }).focus()
  await expect
    .poll(() => requests.includes('/v1/admin/products/' + id))
    .toBe(true)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('sidebar route segments prefetch only after a deliberate hover dwell', async ({
  page,
}) => {
  const routePrefetches = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/inventory' && url.searchParams.has('_rsc'))
      routePrefetches.push(url.href)
  })
  await connect(page)
  await page.goto('/products')
  await page.waitForTimeout(350)
  expect(routePrefetches).toHaveLength(0)

  const inventoryLink = page
    .getByRole('link', {
      name: 'Inventory',
      exact: true,
    })
    .first()
  await inventoryLink.hover()
  await page.waitForTimeout(60)
  await page.mouse.move(8, 8)
  await page.waitForTimeout(280)
  expect(routePrefetches).toHaveLength(0)

  await inventoryLink.hover()
  await expect.poll(() => routePrefetches.length).toBeGreaterThan(0)
})

test('products do not revalidate on ordinary window focus or scroll events', async ({
  page,
}) => {
  let productListReads = 0
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/v1/admin/products') productListReads++
  })
  await connect(page)
  await page.goto('/products')
  await expect(page.getByTestId('product-row')).toHaveCount(1)
  await expect.poll(() => productListReads).toBe(1)

  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('scroll'))
  })
  await page.waitForTimeout(100)
  expect(productListReads).toBe(1)
})

test('identity checks coalesce a tab return and its paired focus event', async ({
  page,
}) => {
  let identityReads = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/v1/admin/auth/me') identityReads++
  })
  await connect(page)
  await page.goto('/products')
  await expect(page.getByTestId('product-row')).toHaveCount(1)
  await expect.poll(() => identityReads).toBe(1)

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
  })
  await expect.poll(() => identityReads).toBe(2)
  await page.waitForTimeout(100)
  expect(identityReads).toBe(2)
})

test('product table scrolling does not trigger speculative detail requests', async ({
  page,
}) => {
  const requests = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/v1/admin/')) requests.push(url.pathname)
  })
  await connect(page)
  await page.goto('/products')
  await expect(page.getByTestId('product-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Details', exact: true }).hover()
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(350)
  expect(requests).not.toContain('/v1/admin/products/' + id)
})

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
test('products use aligned catalog table with connected data and edit dialog', async ({
  page,
}) => {
  await connect(page)
  await page.goto('/products')
  await expect(
    page.getByRole('cell', { name: 'Connected product SKU-001' }),
  ).toBeVisible()
  await expect(page.locator('.product-table th')).toHaveCount(8)
  await expect(page.getByTestId('product-row')).toHaveCount(1)
  await expect(
    page.getByRole('img', { name: 'No product image' }),
  ).toBeVisible()
  await expect(
    page.getByRole('cell', { name: '$25.99', exact: true }),
  ).toBeVisible()
  const actionsCell = page.getByTestId('product-row').locator('td').last()
  await expect(actionsCell.locator('.product-actions')).toBeVisible()
  expect(
    await actionsCell.evaluate((element) => getComputedStyle(element).display),
  ).toBe('table-cell')
  expect(
    await actionsCell
      .locator('.product-actions')
      .evaluate((element) => getComputedStyle(element).display),
  ).toBe('flex')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Edit product' })).toBeVisible()
  await expect(page.getByLabel('Product title')).toHaveValue(
    'Connected product',
  )
  await expect(page.getByLabel('Price (USD)', { exact: true })).toHaveValue(
    '25.99',
  )
})
test('product thumbnails use small responsive candidates and async lazy decoding', async ({
  page,
}) => {
  const responsiveProduct = {
    ...product,
    gallery: [
      {
        id,
        url: 'https://res.cloudinary.com/demo/image/upload/v1720012345/shirt.png',
        srcSet:
          'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320/v1720012345/shirt.png 320w, https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/v1720012345/shirt.png 640w',
        sizes: '(max-width: 640px) 100vw, 33vw',
        alt: 'Front of shirt',
        position: 0,
        width: 960,
        height: 720,
      },
    ],
  }
  await connect(page)
  await page.route('**/v1/admin/products**', (route) =>
    route.fulfill({ json: pageOf([responsiveProduct]) }),
  )
  await page.route('https://res.cloudinary.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  )
  await page.goto('/products')
  const thumbnail = page.getByRole('img', { name: 'Front of shirt' })
  await expect(thumbnail).toBeVisible()
  await expect(thumbnail).toHaveAttribute('sizes', '48px')
  await expect(thumbnail).toHaveAttribute('loading', 'lazy')
  await expect(thumbnail).toHaveAttribute('decoding', 'async')
  await expect(thumbnail).toHaveAttribute('fetchpriority', 'low')
  await expect(thumbnail).toHaveAttribute('srcset', /320w.*640w/)
})

test('variant products distinguish variant-managed stock from variant count', async ({
  page,
}) => {
  await connect(page)
  const variantProduct = {
    ...product,
    hasVariants: true,
    stockOnHand: 0,
    variants: [
      {
        id: '00000000-0000-4000-8000-000000000011',
        productId: id,
        sku: 'SKU-001-S',
        options: { size: 'S' },
        priceMinor: null,
        stockOnHand: 4,
      },
      {
        id: '00000000-0000-4000-8000-000000000012',
        productId: id,
        sku: 'SKU-001-M',
        options: { size: 'M' },
        priceMinor: null,
        stockOnHand: 8,
      },
    ],
  }
  await page.route('**/v1/admin/products**', (route) =>
    route.fulfill({ json: pageOf([variantProduct]) }),
  )
  await page.goto('/products')
  const row = page.getByTestId('product-row')
  await expect(row.getByText('Managed by variants')).toBeVisible()
  await expect(row.getByRole('cell', { name: '2', exact: true })).toBeVisible()
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
      if (path === '/products') {
        const productRegion = page.getByRole('region', {
          name: 'Products list',
        })
        await expect(productRegion).toBeVisible()
        expect(
          await productRegion.evaluate(
            (element) => element.scrollWidth > element.clientWidth,
          ),
        ).toBe(true)
      }
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
  await expect(
    page.getByRole('status', {
      name: /Loading admin section|Loading .* section/,
    }),
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

test('owner configures a default delivery charge with a revision and no tax controls', async ({
  page,
}) => {
  await connect(page)
  let saved = null
  const payloads = []
  await page.route('**/v1/admin/checkout/defaults', async (route) => {
    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON()
      payloads.push(payload)
      saved = { ...payload, revision: (saved?.revision || 0) + 1 }
      return route.fulfill({ json: saved })
    }
    return route.fulfill({ json: saved ? [saved] : [] })
  })
  await page.route('**/v1/admin/checkout/rates', (route) =>
    route.fulfill({ json: [] }),
  )
  await page.route('**/v1/admin/checkout/zones', (route) =>
    route.fulfill({ json: [] }),
  )
  await page.goto('/shipping')
  await expect(
    page.getByRole('heading', { name: 'Delivery settings', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Configure default rate', exact: true })
    .click()
  await page
    .getByLabel('Default shipping (minor units)', { exact: true })
    .fill('500')
  await page
    .getByLabel('Default free-delivery threshold (blank disables)', {
      exact: true,
    })
    .fill('5000')
  await page
    .getByRole('button', { name: 'Save configuration', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Edit default USD', exact: true }),
  ).toBeVisible()
  expect(payloads[0]).toEqual({
    currency: 'USD',
    expectedRevision: 0,
    shippingMinor: 500,
    freeOverSubtotalMinor: 5000,
  })
  await page
    .getByRole('button', { name: 'Edit default USD', exact: true })
    .click()
  await page
    .getByLabel('Default shipping (minor units)', { exact: true })
    .fill('')
  await page
    .getByRole('button', { name: 'Save configuration', exact: true })
    .click()
  await expect.poll(() => payloads.length).toBe(2)
  expect(payloads[1]).toMatchObject({
    currency: 'USD',
    expectedRevision: 1,
    shippingMinor: 0,
  })
  await expect(page.getByLabel(/tax/i)).toHaveCount(0)
})

test('catalog loading uses an accessible skeleton until the API data arrives', async ({
  page,
}) => {
  await connect(page)
  await page.route('**/v1/admin/products**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 550))
    await route.fulfill({ json: pageOf([product]) })
  })
  await page.goto('/products')
  await expect(
    page.getByRole('status', { name: 'Loading current data' }),
  ).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'Connected product SKU-001' }),
  ).toBeVisible()
  await expect(
    page.getByRole('status', { name: 'Loading current data' }),
  ).toHaveCount(0)
})

test('quick navigation displays the delayed global route progress indicator', async ({
  page,
}) => {
  await connect(page)
  await page.route('**/products**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/products')
      await new Promise((resolve) => setTimeout(resolve, 1200))
    await route.continue()
  })
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Jump to section' }).click()
  await page.getByRole('option', { name: 'Products' }).click()
  await expect(
    page.getByRole('progressbar', { name: 'Loading page' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/products$/)
  await expect(page.locator('.admin-table')).toBeVisible()
  await expect(
    page.getByRole('progressbar', { name: 'Loading page' }),
  ).toHaveCount(0)
})

test('save feedback keeps the button width stable and prevents repeat submission', async ({
  page,
}) => {
  await connect(page)
  let writes = 0
  await page.route('**/v1/admin/products/' + id, async (route) => {
    if (route.request().method() === 'PATCH') {
      writes++
      await new Promise((resolve) => setTimeout(resolve, 550))
      await route.fulfill({ json: product })
      return
    }
    await route.fulfill({ json: product })
  })
  await page.goto('/products')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  const save = page.getByRole('button', { name: 'Save product', exact: true })
  const before = await save.boundingBox()
  await save.click()
  const pending = page.getByRole('button', { name: /Saving product/ })
  await expect(pending).toBeDisabled()
  await expect(pending).toHaveAttribute('aria-busy', 'true')
  const during = await pending.boundingBox()
  expect(during.width).toBeCloseTo(before.width, 0)
  await expect.poll(() => writes).toBe(1)
  await expect(page.getByText('Product saved.')).toBeVisible()
  await expect(pending).toHaveCount(0)
})

test('cached product data stays visible while a refresh is pending', async ({
  page,
}) => {
  await connect(page)
  await page.goto('/products')
  const productRow = page.getByRole('cell', {
    name: 'Connected product SKU-001',
  })
  await expect(productRow).toBeVisible()

  let refreshes = 0
  await page.route('**/v1/admin/products**', async (route) => {
    refreshes++
    await new Promise((resolve) => setTimeout(resolve, 600))
    await route.fulfill({ json: pageOf([product]) })
  })

  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  const refreshing = page.getByRole('button', { name: /Refreshing/ })
  await expect(refreshing).toBeDisabled()
  await expect(productRow).toBeVisible()
  await expect.poll(() => refreshes).toBe(1)
  await expect(
    page.getByRole('button', { name: 'Refresh', exact: true }),
  ).toBeEnabled()
})
