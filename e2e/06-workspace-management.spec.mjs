import { test, expect } from '@playwright/test'
import { go, click, fill, select } from './helpers.mjs'

test('staff preview create, duplicate email validation and persistence', async ({
  page,
}) => {
  await go(page, '/staff', 'Open staff directory')
  await expect(page.getByTestId('staff-count')).toHaveText('3')
  await click(
    page,
    page.getByRole('button', { name: 'Add staff member' }),
    'Open staff form',
  )
  const modal = page.getByRole('dialog')
  await fill(
    page,
    modal.getByRole('textbox', { name: 'Full name' }),
    'Taylor Example',
    'Enter staff name',
  )
  await fill(
    page,
    modal.getByRole('textbox', { name: 'Email address' }),
    'owner@example.test',
    'Enter duplicate email',
  )
  await click(
    page,
    modal.getByRole('button', { name: 'Save staff member' }),
    'Validate duplicate staff email',
  )
  await expect(modal.getByRole('alert')).toContainText('already exists')
  await fill(
    page,
    modal.getByRole('textbox', { name: 'Email address' }),
    'taylor@example.test',
    'Enter new sample email',
  )
  await select(
    page,
    modal.getByRole('combobox', { name: 'Staff role' }),
    'Analyst',
    'Set staff role',
  )
  await click(
    page,
    modal.getByRole('button', { name: 'Save staff member' }),
    'Save sample staff member',
  )
  await expect(page.getByTestId('staff-count')).toHaveText('4')
  await expect(page.getByText('Taylor Example')).toBeVisible()
  await page.reload()
  await page.locator('html[data-admin-ready="true"]').waitFor()
  await expect(page.getByText('Taylor Example')).toBeVisible()
})

test('role permissions can be edited locally and owner template is fixed', async ({
  page,
}) => {
  await go(page, '/staff', 'Open staff permission preview')
  await click(
    page,
    page.getByRole('tab', { name: 'Role permission matrix' }),
    'Open role matrix',
  )
  await expect(
    page.getByRole('checkbox', { name: 'Adjust stock' }),
  ).toBeChecked()
  await click(
    page,
    page.getByRole('checkbox', { name: 'Adjust stock' }),
    'Toggle Manager stock permission',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save role preview' }),
    'Save local role settings',
  )
  await page.reload()
  await page.locator('html[data-admin-ready="true"]').waitFor()
  await click(
    page,
    page.getByRole('tab', { name: 'Role permission matrix' }),
    'Review persisted role',
  )
  await expect(
    page.getByRole('checkbox', { name: 'Adjust stock' }),
  ).not.toBeChecked()
  await select(
    page,
    page.getByRole('combobox', { name: 'Choose role' }),
    'Owner',
    'Inspect Owner role',
  )
  await expect(
    page.getByRole('checkbox', { name: 'Adjust stock' }),
  ).toBeChecked()
  await expect(
    page.getByRole('button', { name: 'Save role preview' }),
  ).toBeDisabled()
})

test('store settings reject unsafe URL and persist English/USD defaults', async ({
  page,
}) => {
  await go(page, '/settings', 'Open store preferences')
  await expect(page.getByText('USD ($) — locked')).toBeVisible()
  await fill(
    page,
    page.getByRole('textbox', { name: 'Storefront URL (HTTPS)' }),
    'javascript:alert(1)',
    'Enter invalid store URL',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save store settings' }),
    'Validate HTTPS URL',
  )
  await expect(
    page.getByText('Website URL must be a valid HTTPS address.', {
      exact: true,
    }),
  ).toBeVisible()
  await fill(
    page,
    page.getByRole('textbox', { name: 'Storefront URL (HTTPS)' }),
    'https://eshop.example',
    'Set sample HTTPS URL',
  )
  await fill(
    page,
    page.getByRole('textbox', { name: 'Store display name' }),
    'eShop Global',
    'Update display name',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save store settings' }),
    'Save local store settings',
  )
  await expect(page.getByRole('status')).toContainText('saved locally')
  await page.reload()
  await page.locator('html[data-admin-ready="true"]').waitFor()
  await expect(
    page.getByRole('textbox', { name: 'Store display name' }),
  ).toHaveValue('eShop Global')
  await expect(page.getByText('English — locked')).toBeVisible()
})

test('activity preview records settings changes, filters and excludes real audit claims', async ({
  page,
}) => {
  await go(page, '/settings', 'Open settings before activity check')
  await fill(
    page,
    page.getByRole('textbox', { name: 'Store display name' }),
    'eShop Demo Workspace',
    'Change sample workspace name',
  )
  await click(
    page,
    page.getByRole('button', { name: 'Save store settings' }),
    'Save activity-generating change',
  )
  await go(page, '/activity', 'Open local activity history')
  await expect(
    page.getByRole('heading', { name: 'Activity preview' }),
  ).toBeVisible()
  await expect(page.getByText('Store settings updated')).toBeVisible()
  await select(
    page,
    page.getByRole('combobox', { name: 'Activity area' }),
    'Staff',
    'Filter staff activity',
  )
  await expect(page.getByText('Store settings updated')).toHaveCount(0)
  await expect(page.getByText('No matching local events')).toBeVisible()
})
