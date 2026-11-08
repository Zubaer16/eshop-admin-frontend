import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

test('sales report date filter and CSV download use local order values', async ({
  page,
}) => {
  await go(page, '/reports', 'Open analytics & reports')
  await expect(
    page.getByRole('heading', { name: 'Analytics & reports' }),
  ).toBeVisible()
  await expect(
    page.getByRole('tab', { name: 'Sales & orders' }),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(
    page.getByText('Sample order value', { exact: true }),
  ).toBeVisible()
  await select(
    page,
    page.getByRole('combobox', { name: 'Report date range' }),
    'custom',
    'Choose custom date range',
  )
  await fill(
    page,
    page.getByLabel('From date'),
    '2026-10-16',
    'Set report start',
  )
  await fill(page, page.getByLabel('To date'), '2026-10-17', 'Set report end')
  await expect(page.getByTestId('report-range-note')).toContainText(
    '2026-10-16 through 2026-10-17',
  )
  await expect(
    page.getByRole('tabpanel').getByText('$363.00', { exact: true }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole('row').filter({ hasText: 'KB-1048' }),
  ).toBeVisible()
  await expect(
    page.getByRole('row').filter({ hasText: 'KB-1045' }),
  ).toHaveCount(0)
  const started = page.waitForEvent('download')
  await click(
    page,
    page.getByRole('button', { name: 'Export sales CSV' }),
    'Export sales CSV',
  )
  const downloaded = await started
  expect(downloaded.suggestedFilename()).toContain(
    'eshop-sales-preview-2026-10-16-2026-10-17.csv',
  )
})

test('product report uses variant-aware current stock and order quantities', async ({
  page,
}) => {
  await go(page, '/reports', 'Open reporting screen')
  await click(
    page,
    page.getByRole('tab', { name: 'Product performance' }),
    'View product performance',
  )
  await expect(
    page.getByRole('tab', { name: 'Product performance' }),
  ).toHaveAttribute('aria-selected', 'true')
  const sneakers = page
    .getByRole('row')
    .filter({ hasText: 'Motion Everyday Sneakers' })
  await expect(sneakers).toContainText('12')
  await expect(sneakers).toContainText('$110.00')
  await expect(
    page.getByRole('button', { name: 'Export products CSV' }),
  ).toBeEnabled()
})

test('inventory report highlights current low and zero stock', async ({
  page,
}) => {
  await go(page, '/reports', 'Open reports for inventory')
  await click(
    page,
    page.getByRole('tab', { name: 'Inventory', exact: true }),
    'Switch to inventory report',
  )
  const speaker = page.getByRole('row').filter({ hasText: 'Echo Mini Speaker' })
  await expect(speaker).toContainText('Out of stock')
  const serum = page
    .getByRole('row')
    .filter({ hasText: 'Dew Hydrating Face Serum' })
  await expect(serum).toContainText('Low stock')
  await expect(page.getByText('Recent preview adjustments')).toBeVisible()
})

test('customer insights and invalid custom dates show accurate preview boundaries', async ({
  page,
}) => {
  await go(page, '/reports', 'Open customer reports')
  await click(
    page,
    page.getByRole('tab', { name: 'Customers' }),
    'Switch to customers',
  )
  await expect(
    page.getByRole('row').filter({ hasText: 'Olivia Bennett' }),
  ).toContainText('$114.00')
  await select(
    page,
    page.getByRole('combobox', { name: 'Report date range' }),
    'custom',
    'Choose custom range',
  )
  await fill(
    page,
    page.getByLabel('From date'),
    '2026-10-18',
    'Enter later start',
  )
  await fill(
    page,
    page.getByLabel('To date'),
    '2026-10-01',
    'Enter earlier end',
  )
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'From date must not be after To date',
  )
  await expect(
    page.getByRole('button', { name: 'Export customers CSV' }),
  ).toBeDisabled()
  await click(
    page,
    page.getByRole('button', { name: 'Reset dates' }),
    'Reset invalid range',
  )
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0)
})
