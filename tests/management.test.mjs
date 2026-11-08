import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formPayload } from '../lib/api/management-payload.ts'
import { formContracts } from '../lib/api/management-contract.ts'
test('published settings payloads use DTO allowlists and server revision; provider/CORS authority cannot be injected', () => {
  const data = new FormData()
  data.set('expectedRevision', '999')
  data.set('locale', 'en-US')
  data.set('displayCurrency', 'USD')
  data.set('orderPrefix', 'ES')
  data.set('themeMode', 'light')
  data.set('accentColor', '#112233')
  data.set('storefrontOrigin', '')
  data.set('adminOrigin', '')
  data.set('showWishlist', 'on')
  data.set('STRIPE_SECRET_KEY', 'forbidden')
  data.set('deploymentCorsOrigins', '*')
  const result = formPayload(formContracts.PutStoreOperationsDto, data, 4)
  assert.equal(result.expectedRevision, 4)
  assert.equal(result.showWishlist, true)
  assert.equal(result.showPolicies, false)
  assert.ok(!Object.hasOwn(result, 'STRIPE_SECRET_KEY'))
  assert.ok(!Object.hasOwn(result, 'deploymentCorsOrigins'))
})
test('staff creation preserves exact write-only password and editing has no password/email/OWNER authority', () => {
  const data = new FormData()
  data.set('name', 'Operator')
  data.set('email', 'operator@example.test')
  data.set('role', 'SUPPORT')
  data.set('password', '  Secret-Passphrase-123!  ')
  const created = formPayload(formContracts.StaffCreateDto, data, 0)
  assert.equal(created.password, '  Secret-Passphrase-123!  ')
  const edited = formPayload(formContracts.StaffUpdateDto, data, 0)
  assert.ok(!Object.hasOwn(edited, 'password'))
  assert.ok(!Object.hasOwn(edited, 'email'))
  assert.ok(
    !formContracts.StaffCreateDto.find((f) => f.key === 'role').enum.includes(
      'OWNER',
    ),
  )
})
test('null media detach and ordered canonical collection IDs remain distinct from arbitrary URLs', () => {
  const data = new FormData()
  data.set('logoMediaId', '')
  data.set('faviconMediaId', '')
  assert.deepEqual(formPayload(formContracts.PutStoreBrandingDto, data, 3), {
    expectedRevision: 3,
    logoMediaId: null,
    faviconMediaId: null,
  })
  const c = new FormData()
  c.set('status', 'DRAFT')
  c.set('position', '1')
  c.set('title', 'Collection')
  c.set('slug', 'collection')
  c.set('description', '')
  c.set(
    'productIds',
    '00000000-0000-4000-8000-000000000001, 00000000-0000-4000-8000-000000000002',
  )
  assert.equal(
    formPayload(formContracts.SaveFeaturedCollectionDto, c, 1).productIds
      .length,
    2,
  )
  c.set('position', '1.5')
  assert.throws(() =>
    formPayload(formContracts.SaveFeaturedCollectionDto, c, 1),
  )
})
