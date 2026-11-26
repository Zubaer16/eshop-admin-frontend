import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatBasisPoints,
  fromUtcDateTimeInput,
  shortPromotionId,
  toUtcDateTimeInput,
} from '../lib/promotion-presentation.ts'

test('percentage coupon basis points are presented as percentages', () => {
  assert.equal(formatBasisPoints(1000), '10%')
  assert.equal(formatBasisPoints(1250), '12.5%')
  assert.equal(formatBasisPoints(1), '0.01%')
  assert.equal(formatBasisPoints(0), '0%')
})

test('datetime-local presentation round-trips the same instant', () => {
  const source = '2026-11-26T10:35:00.000Z'
  const local = toUtcDateTimeInput(source)
  const restored = fromUtcDateTimeInput(local)
  assert.ok(local)
  assert.equal(new Date(restored).getTime(), new Date(source).getTime())
  const withMilliseconds = '2026-11-26T10:35:12.345Z'
  assert.equal(
    new Date(
      fromUtcDateTimeInput(toUtcDateTimeInput(withMilliseconds)),
    ).getTime(),
    new Date(withMilliseconds).getTime(),
  )
  assert.equal(fromUtcDateTimeInput(''), null)
})

test('invalid date input is rejected and references are shortened only for display', () => {
  assert.throws(
    () => fromUtcDateTimeInput('not-a-date'),
    /valid UTC date and time/i,
  )
  assert.equal(
    shortPromotionId('00000000-0000-4000-8000-000000000001'),
    '00000000',
  )
})
