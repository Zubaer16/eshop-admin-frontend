import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transferImage } from '../lib/api/media-upload.ts'
const file = () =>
  new File([new Uint8Array([1, 2, 3])], 'fixture.png', { type: 'image/png' })
const instruction = (overrides) => ({
  mediaId: 'fixture',
  uploadUrl: 'https://storage.example.test/signed',
  method: 'PUT',
  fields: {},
  headers: { 'Content-Type': 'image/png', 'If-None-Match': '*' },
  expiresAt: new Date(Date.now() + 60000).toISOString(),
  ...overrides,
})
test('signed PUT sends raw bytes and server headers without API bearer or cookies', async () => {
  const calls = []
  const image = file()
  await transferImage(image, instruction(), async (url, options) => {
    calls.push({ url, ...options })
    return new Response('', { status: 200 })
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, 'PUT')
  assert.equal(calls[0].body, image)
  assert.equal(calls[0].credentials, 'omit')
  assert.equal(calls[0].redirect, 'error')
  assert.equal(calls[0].headers.Authorization, undefined)
})
test('Cloudinary POST uses multipart signed fields plus file, without invented content-type', async () => {
  await transferImage(
    file(),
    instruction({
      method: 'POST',
      fields: { signature: 'fixture-signature', timestamp: 123 },
      headers: {},
    }),
    async (_url, options) => {
      assert(options.body instanceof FormData)
      assert.equal(options.body.get('timestamp'), '123')
      assert(options.body.get('file') instanceof File)
      assert.equal(options.headers['Content-Type'], undefined)
      return new Response('', { status: 200 })
    },
  )
})
test('expired/insecure instructions and secret headers fail before transfer; ambiguous failure never retries', async () => {
  let calls = 0
  const send = async () => {
    calls++
    return new Response('', { status: 412 })
  }
  for (const changes of [
    { uploadUrl: 'file:///secret' },
    { uploadUrl: 'https://user:secret@example.test' },
    { expiresAt: 'invalid' },
    { expiresAt: '2000-01-01' },
    { headers: { Authorization: 'forbidden' } },
  ])
    await assert.rejects(transferImage(file(), instruction(changes), send))
  assert.equal(calls, 0)
  await assert.rejects(
    transferImage(file(), instruction(), send),
    /Verify uploaded file/,
  )
  assert.equal(calls, 1)
})
