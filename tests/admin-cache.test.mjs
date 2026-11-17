import test from 'node:test'
import assert from 'node:assert/strict'
import { createAdminCache, adminOwner } from '../lib/admin-cache-core.ts'

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'staff@example.test',
  role: 'STAFF',
  staffRole: 'OPERATIONS',
  permissions: ['orders.read', 'catalog.read'],
}
const session = (overrides = {}) => {
  const { user: userOverrides = {}, ...rest } = overrides
  return {
    status: 'authenticated',
    user: { ...user, ...userOverrides },
    epoch: 1,
    notice: '',
    ...rest,
  }
}

function setup({ limit = 40, ttlNow = 1000 } = {}) {
  let current = session()
  let now = ttlNow
  const calls = []
  const cache = createAdminCache({
    session: () => current,
    now: () => now,
    limit,
    request: async (route, query) => {
      calls.push({ route, query })
      return { route, query, calls: calls.length }
    },
  })
  return {
    cache,
    calls,
    setSession(value) {
      current = value
    },
    setNow(value) {
      now = value
    },
  }
}

test('only explicitly approved admin GET resources are cacheable', () => {
  const { cache } = setup()
  assert.equal(cache.isCacheable('/v1/admin/products'), true)
  assert.equal(cache.isCacheable('/v1/admin/inventory/abc-123/movements'), true)
  assert.equal(cache.isCacheable('/v1/admin/customers'), false)
  assert.equal(cache.isCacheable('/v1/admin/staff'), false)
  assert.equal(cache.isCacheable('/v1/admin/roles'), false)
  assert.equal(cache.isCacheable('/v1/admin/reports/payments'), false)
  assert.equal(cache.isCacheable('/v1/admin/activity'), false)
  assert.equal(cache.isCacheable('/v1/account/profile'), false)
})

test('concurrent reads are deduplicated and fresh values are reused', async () => {
  const { cache, calls } = setup()
  const [a, b] = await Promise.all([
    cache.read('/v1/admin/products', { page: 1, limit: 20 }),
    cache.read('/v1/admin/products', { limit: 20, page: 1 }),
  ])
  assert.deepEqual(a, b)
  assert.equal(calls.length, 1)
  await cache.read('/v1/admin/products', { page: 1, limit: 20 })
  assert.equal(calls.length, 1)
})

test('cached objects are cloned and TTL expiry refreshes in the background', async () => {
  const { cache, calls, setNow } = setup()
  const first = await cache.read('/v1/admin/categories')
  first.changed = true
  assert.equal(cache.peek('/v1/admin/categories').changed, undefined)
  setNow(31_001)
  assert.equal(cache.peek('/v1/admin/categories').route, '/v1/admin/categories')
  await cache.read('/v1/admin/categories')
  assert.equal(calls.length, 2)
})

test('session, role, permission and epoch changes clear private cache ownership', async () => {
  const { cache, setSession } = setup()
  await cache.read('/v1/admin/products')
  assert.ok(cache.peek('/v1/admin/products'))
  setSession(session({ epoch: 2 }))
  cache.syncSession()
  assert.equal(cache.peek('/v1/admin/products'), null)
  await cache.read('/v1/admin/products')
  setSession(session({ user: { permissions: ['orders.read'] } }))
  cache.syncSession()
  assert.equal(cache.peek('/v1/admin/products'), null)
  assert.notEqual(
    adminOwner(session()),
    adminOwner(session({ user: { permissions: ['orders.read'] } })),
  )
})

test('old session responses cannot repopulate the cache after an account switch', async () => {
  let current = session()
  let release
  const cache = createAdminCache({
    session: () => current,
    request: () =>
      new Promise((resolve) => {
        release = resolve
      }),
  })
  const pending = cache.read('/v1/admin/products').catch((error) => error)
  await Promise.resolve()
  current = session({
    epoch: 2,
    user: { id: '22222222-2222-4222-8222-222222222222' },
  })
  cache.syncSession()
  release({ secret: 'old-session-data' })
  await pending
  assert.equal(cache.peek('/v1/admin/products'), null)
})

test('failed requests can be retried and cache remains bounded', async () => {
  let fail = true
  let current = session()
  const cache = createAdminCache({
    session: () => current,
    limit: 2,
    request: async (route) => {
      if (fail) throw new Error('temporary')
      return { route }
    },
  })
  await assert.rejects(cache.read('/v1/admin/products'), /temporary/)
  fail = false
  await cache.read('/v1/admin/products')
  await cache.read('/v1/admin/categories')
  await cache.read('/v1/admin/dashboard/overview')
  assert.equal(cache.peek('/v1/admin/products'), null)
  assert.ok(cache.peek('/v1/admin/dashboard/overview'))
})

test('mutation invalidation keeps stale data visible but forces a fresh read', async () => {
  const { cache, calls } = setup()
  await cache.read('/v1/admin/products')
  const before = cache.getInvalidationVersion()
  cache.invalidateAll()
  assert.equal(cache.getInvalidationVersion(), before + 1)
  assert.ok(cache.peek('/v1/admin/products'))
  await cache.read('/v1/admin/products')
  assert.equal(calls.length, 2)
})
