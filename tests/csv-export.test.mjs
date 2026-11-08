import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from '../lib/api/runtime.ts'
const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'owner@example.test',
  role: 'OWNER',
  staffRole: 'OWNER',
  permissions: ['payments.view'],
}
const json = (value) =>
  new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  })
test('CSV uses the same authenticated/session-fenced transport and retains integer strings/formula neutralization', async () => {
  let seen
  const csv = "currency,paidMinor,title\r\nUSD,9007199254740993,' =1+1\r\n"
  const client = createApiClient({
    audience: 'staff',
    baseUrl: () => 'https://api.example.test',
    fetch: async (url, init) => {
      const path = new URL(url).pathname
      if (path.endsWith('/login'))
        return json({
          accessToken: 'a'.repeat(40),
          refreshToken: 'r'.repeat(40),
          tokenType: 'Bearer',
          expiresIn: 60,
          user,
        })
      if (path.endsWith('/me')) return json(user)
      seen = init
      return new Response(csv, { headers: { 'Content-Type': 'text/csv' } })
    },
  })
  await client.signIn({
    email: user.email,
    password: 'Fixture-Only-Password-123!',
  })
  assert.equal(
    await client.request('/v1/admin/reports/export/sales', {
      responseType: 'text',
    }),
    csv,
  )
  assert.equal(seen.credentials, 'omit')
  assert.equal(seen.headers.Accept, 'text/csv')
  assert.ok(seen.headers.Authorization.startsWith('Bearer '))
})
