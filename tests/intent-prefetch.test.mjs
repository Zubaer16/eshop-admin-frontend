import test from 'node:test'
import assert from 'node:assert/strict'
import { createIntentPrefetch } from '../lib/intent-prefetch.ts'

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

test('pointer prefetch waits for the configured dwell time', async () => {
  const intent = createIntentPrefetch(25)
  let calls = 0
  intent.schedule('row-1', () => calls++)
  await wait(10)
  assert.equal(calls, 0)
  await wait(25)
  assert.equal(calls, 1)
  intent.cancelAll()
})

test('pointer leave cancels a pending prefetch', async () => {
  const intent = createIntentPrefetch(20)
  let calls = 0
  intent.schedule('row-1', () => calls++)
  intent.cancel('row-1')
  await wait(35)
  assert.equal(calls, 0)
})

test('re-entering replaces the earlier dwell timer', async () => {
  const intent = createIntentPrefetch(25)
  const calls = []
  intent.schedule('row-1', () => calls.push('first'))
  await wait(12)
  intent.schedule('row-1', () => calls.push('second'))
  await wait(18)
  assert.deepEqual(calls, [])
  await wait(15)
  assert.deepEqual(calls, ['second'])
})

test('explicit focus or touch intent runs immediately and cancels hover work', async () => {
  const intent = createIntentPrefetch(30)
  const calls = []
  intent.schedule('row-1', () => calls.push('hover'))
  intent.run('row-1', () => calls.push('explicit'))
  assert.deepEqual(calls, ['explicit'])
  await wait(40)
  assert.deepEqual(calls, ['explicit'])
})

test('unmount cleanup cancels every pending prefetch', async () => {
  const intent = createIntentPrefetch(20)
  let calls = 0
  intent.schedule('row-1', () => calls++)
  intent.schedule('row-2', () => calls++)
  intent.cancelAll()
  await wait(35)
  assert.equal(calls, 0)
})

test('invalid delay values safely fall back to the default dwell', async () => {
  const intent = createIntentPrefetch(Number.NaN)
  let calls = 0
  intent.schedule('row-1', () => calls++)
  intent.cancelAll()
  assert.equal(calls, 0)
})
