import test from 'node:test'
import assert from 'node:assert/strict'
import { canVisit } from '../lib/admin-access.ts'
import {
  adminPrefetchPath,
  canPrefetchAdminPath,
  getAdminInventoryPrefetchPlan,
  getAdminPrefetchPlan,
  getAdminProductPrefetchPlan,
  getAdminPromotionCampaignPrefetchPlan,
  getAdminWorkspacePreloadRoutes,
} from '../lib/admin-prefetch-core.ts'
import { createAdminPrefetchIntent } from '../lib/admin-prefetch-intent.ts'

const id = '11111111-1111-4111-8111-111111111111'

test('route intent plans include only the current page first-read resources', () => {
  assert.deepEqual(getAdminPrefetchPlan('/dashboard'), [
    ['/v1/admin/dashboard/overview'],
  ])
  assert.deepEqual(getAdminPrefetchPlan('/products'), [
    ['/v1/admin/products', { page: 1, limit: 20 }],
    ['/v1/admin/categories'],
  ])
  assert.deepEqual(getAdminPrefetchPlan('/messaging'), [
    ['/v1/admin/push/campaigns', { page: 1, limit: 20 }],
  ])
})

test('href parsing accepts internal route intents and rejects unsafe destinations', () => {
  assert.equal(adminPrefetchPath('/products?status=ACTIVE#table'), '/products')
  assert.equal(adminPrefetchPath('/products/'), '/products')
  assert.equal(adminPrefetchPath('//outside.example/products'), null)
  assert.equal(adminPrefetchPath('https://outside.example/products'), null)
  assert.equal(adminPrefetchPath('/products\\..\\staff'), null)
  assert.equal(adminPrefetchPath('/products\n/staff'), null)
})

test('preload permission follows section access and OWNER-only shipping UI', () => {
  const owner = {
    id,
    email: 'owner@example.test',
    role: 'OWNER',
    staffRole: null,
    permissions: [],
  }
  const shippingStaff = {
    id,
    email: 'staff@example.test',
    role: 'STAFF',
    staffRole: 'SHIPPING',
    permissions: ['shipping.manage'],
  }
  const orderStaff = { ...shippingStaff, permissions: ['orders.manage'] }
  assert.equal(canPrefetchAdminPath('/shipping', owner, canVisit), true)
  assert.equal(
    canPrefetchAdminPath('/shipping', shippingStaff, canVisit),
    false,
  )
  assert.equal(canPrefetchAdminPath('/orders', shippingStaff, canVisit), false)
  assert.equal(canPrefetchAdminPath('/orders', orderStaff, canVisit), true)
})

test('sensitive and non-cacheable sections have no speculative request plan', () => {
  for (const path of [
    '/customers',
    '/payments',
    '/reports',
    '/staff',
    '/settings',
    '/operations',
    '/activity',
    '/alignment',
    '/notifications',
  ])
    assert.deepEqual(getAdminPrefetchPlan(path), [], path)
})

test('login preload is deliberately bounded to high-value first-read routes', () => {
  assert.deepEqual(getAdminWorkspacePreloadRoutes(), [
    '/dashboard',
    '/categories',
    '/orders',
  ])
})

test('product detail intent preload validates canonical UUIDs', () => {
  assert.deepEqual(getAdminProductPrefetchPlan(id), [
    [`/v1/admin/products/${id}`],
  ])
  assert.deepEqual(getAdminProductPrefetchPlan('not-a-uuid'), [])
})

test('inventory detail intent preload validates UUID and first movements page', () => {
  assert.deepEqual(getAdminInventoryPrefetchPlan(id), [
    [`/v1/admin/inventory/${id}`],
    [`/v1/admin/inventory/${id}/movements`, { page: 1, limit: 10 }],
  ])
  assert.deepEqual(getAdminInventoryPrefetchPlan('../staff'), [])
})

test('promotion campaign preload is a single approved read resource', () => {
  assert.deepEqual(getAdminPromotionCampaignPrefetchPlan(), [
    ['/v1/admin/promotions/campaigns', { page: 1, limit: 20 }],
  ])
})

test('pointer intent is delayed, replaced by the latest target, and cancellable', () => {
  const jobs = new Map()
  const cancelled = new Set()
  let nextId = 0
  const delays = []
  const intent = createAdminPrefetchIntent(
    (callback, delay) => {
      const id = nextId++
      jobs.set(id, () => {
        jobs.delete(id)
        callback()
      })
      delays.push(delay)
      return id
    },
    (id) => {
      cancelled.add(id)
      jobs.delete(id)
    },
  )
  const calls = []

  intent.schedule(() => calls.push('products'))
  intent.schedule(() => calls.push('categories'))
  assert.deepEqual(delays, [250, 250])
  assert.ok(cancelled.has(0))
  for (const [id, callback] of jobs) {
    if (!cancelled.has(id)) callback()
  }
  assert.deepEqual(calls, ['categories'])

  intent.schedule(() => calls.push('orders'))
  intent.cancel()
  for (const [id, callback] of jobs) {
    if (!cancelled.has(id)) callback()
  }
  assert.deepEqual(calls, ['categories'])
})
