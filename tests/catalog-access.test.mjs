import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canVisit } from '../lib/admin-access.ts'
test('staff catalog and inventory reads match backend guards while media requires catalog.manage', () => {
  const staff = {
    id: '00000000-0000-4000-8000-000000000001',
    role: 'STAFF',
    permissions: [],
  }
  for (const path of ['/products', '/categories', '/inventory'])
    assert.equal(canVisit(path, staff), true)
  assert.equal(canVisit('/media', staff), false)
  assert.equal(
    canVisit('/media', { ...staff, permissions: ['catalog.manage'] }),
    true,
  )
  assert.equal(
    canVisit('/media', {
      ...staff,
      role: 'CUSTOMER',
      permissions: ['catalog.manage'],
    }),
    false,
  )
})
