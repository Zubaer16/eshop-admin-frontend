import test from 'node:test'
import assert from 'node:assert/strict'
import { bindAdminIdentityRevalidation } from '../lib/auth-identity-lifecycle.ts'

test('identity revalidation coalesces focus and visibility events and checks periodically', () => {
  const visibilityListeners = new Map()
  const focusListeners = new Map()
  const target = {
    visibilityState: 'visible',
    addEventListener(type, listener) {
      visibilityListeners.set(type, listener)
    },
    removeEventListener(type, listener) {
      if (visibilityListeners.get(type) === listener)
        visibilityListeners.delete(type)
    },
  }
  const focusTarget = {
    addEventListener(type, listener) {
      focusListeners.set(type, listener)
    },
    removeEventListener(type, listener) {
      if (focusListeners.get(type) === listener) focusListeners.delete(type)
    },
  }
  let intervalCallback
  let intervalDelay
  let cancelled = false
  let clock = 1_000
  let refreshes = 0
  const dispose = bindAdminIdentityRevalidation(
    async () => {
      refreshes++
    },
    target,
    {
      focusTarget,
      now: () => clock,
      schedule: (callback, delay) => {
        intervalCallback = callback
        intervalDelay = delay
        return 17
      },
      cancel: (handle) => {
        assert.equal(handle, 17)
        cancelled = true
      },
    },
  )
  assert.deepEqual([...visibilityListeners.keys()], ['visibilitychange'])
  assert.deepEqual([...focusListeners.keys()], ['focus'])
  assert.equal(intervalDelay, 60_000)

  // Initial focus shortly after the initial session restore is coalesced.
  focusListeners.get('focus')()
  assert.equal(refreshes, 0)

  clock += 15_001
  focusListeners.get('focus')()
  assert.equal(refreshes, 1)
  focusListeners.get('focus')()
  assert.equal(refreshes, 1)

  target.visibilityState = 'hidden'
  visibilityListeners.get('visibilitychange')()
  intervalCallback()
  assert.equal(refreshes, 1)

  target.visibilityState = 'visible'
  visibilityListeners.get('visibilitychange')()
  focusListeners.get('focus')()
  visibilityListeners.get('visibilitychange')()
  assert.equal(refreshes, 2)

  clock += 60_000
  intervalCallback()
  assert.equal(refreshes, 3)

  dispose()
  assert.equal(cancelled, true)
  assert.equal(visibilityListeners.size, 0)
  assert.equal(focusListeners.size, 0)
})
