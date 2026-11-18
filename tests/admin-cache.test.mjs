import test from 'node:test'
import assert from 'node:assert/strict'
import { createAdminCache, adminOwner } from '../lib/admin-cache-core.ts'
import { bindAdminCacheVisibilityRefresh } from '../lib/admin-cache-lifecycle.ts'

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

test('visibility revalidation refreshes only active resources', async () => {
  const { cache, calls } = setup()
  await cache.read('/v1/admin/products', { page: 1, limit: 20 })
  await cache.read('/v1/admin/categories')
  const deactivate = cache.activate('/v1/admin/products', {
    page: 1,
    limit: 20,
  })
  const before = cache.getInvalidationVersion()

  cache.invalidateActive()
  assert.equal(cache.getInvalidationVersion(), before + 1)
  await cache.read('/v1/admin/products', { page: 1, limit: 20 })
  await cache.read('/v1/admin/categories')
  assert.equal(calls.length, 3)

  deactivate()
  const after = cache.getInvalidationVersion()
  cache.invalidateActive()
  assert.equal(cache.getInvalidationVersion(), after)
})

test('active resource registrations are reference counted', async () => {
  const { cache, calls } = setup()
  await cache.read('/v1/admin/products')
  const releaseFirst = cache.activate('/v1/admin/products')
  const releaseSecond = cache.activate('/v1/admin/products')

  releaseFirst()
  cache.invalidateActive()
  await cache.read('/v1/admin/products')
  assert.equal(calls.length, 2)

  releaseSecond()
  cache.invalidateActive()
  await cache.read('/v1/admin/products')
  assert.equal(calls.length, 2)
})

test('late cleanup from an old session cannot unregister the replacement session resource', async () => {
  const { cache, calls, setSession } = setup()
  await cache.read('/v1/admin/products')
  const releaseOld = cache.activate('/v1/admin/products')

  setSession(
    session({
      epoch: 2,
      user: { id: '22222222-2222-4222-8222-222222222222' },
    }),
  )
  cache.syncSession()
  const releaseNew = cache.activate('/v1/admin/products')
  await cache.read('/v1/admin/products')
  releaseOld()

  const before = cache.getInvalidationVersion()
  cache.invalidateActive()
  assert.equal(cache.getInvalidationVersion(), before + 1)
  await cache.read('/v1/admin/products')
  assert.equal(calls.length, 3)
  releaseNew()
})

test('visibility revalidation does not supersede an active pending request', async () => {
  let release
  let requestCount = 0
  const cache = createAdminCache({
    session: () => session(),
    request: () => {
      requestCount++
      return new Promise((resolve) => {
        release = resolve
      })
    },
  })
  const deactivate = cache.activate('/v1/admin/products')
  const first = cache.read('/v1/admin/products')
  await Promise.resolve()
  cache.invalidateActive()
  const second = cache.read('/v1/admin/products')
  assert.equal(requestCount, 1)
  assert.equal(first, second)

  release({ ok: true })
  await first
  deactivate()
})

test('only a real hidden-to-visible transition refreshes active data', () => {
  const listeners = new Set()
  const target = {
    visibilityState: 'visible',
    addEventListener(type, listener) {
      assert.equal(type, 'visibilitychange')
      listeners.add(listener)
    },
    removeEventListener(type, listener) {
      assert.equal(type, 'visibilitychange')
      listeners.delete(listener)
    },
  }
  let refreshes = 0
  const dispose = bindAdminCacheVisibilityRefresh(
    { invalidateActive: () => refreshes++ },
    target,
  )
  const dispatch = () => listeners.forEach((listener) => listener())

  dispatch()
  assert.equal(refreshes, 0)
  target.visibilityState = 'hidden'
  dispatch()
  assert.equal(refreshes, 0)
  target.visibilityState = 'visible'
  dispatch()
  assert.equal(refreshes, 1)
  dispatch()
  assert.equal(refreshes, 1)

  target.visibilityState = 'hidden'
  dispatch()
  target.visibilityState = 'visible'
  dispatch()
  assert.equal(refreshes, 2)

  dispose()
  target.visibilityState = 'hidden'
  dispatch()
  target.visibilityState = 'visible'
  dispatch()
  assert.equal(refreshes, 2)
})
