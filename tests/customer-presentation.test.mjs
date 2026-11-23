import test from 'node:test'
import assert from 'node:assert/strict'
import {
  customerPageCount,
  customerPageItems,
  customerResultRange,
  customerInitials,
  isCustomerId,
} from '../lib/customer-presentation.ts'

test('customer page count comes only from server total and selected limit', () => {
  assert.equal(customerPageCount(0, 20), 1)
  assert.equal(customerPageCount(1, 20), 1)
  assert.equal(customerPageCount(21, 20), 2)
  assert.equal(customerPageCount(51, 50), 2)
})

test('customer range handles first, later and empty result pages', () => {
  assert.deepEqual(customerResultRange(0, 1, 20), { start: 0, end: 0 })
  assert.deepEqual(customerResultRange(21, 1, 20), { start: 1, end: 20 })
  assert.deepEqual(customerResultRange(21, 2, 20), { start: 21, end: 21 })
  assert.deepEqual(customerResultRange(145, 3, 50), { start: 101, end: 145 })
})

test('numbered customer pagination preserves bounded first/middle/last windows', () => {
  assert.deepEqual(customerPageItems(1, 1), [1])
  assert.deepEqual(customerPageItems(2, 5), [1, 2, 3, 4, 5])
  assert.deepEqual(customerPageItems(1, 10), [
    1,
    2,
    3,
    4,
    5,
    'end-ellipsis',
    10,
  ])
  assert.deepEqual(customerPageItems(5, 10), [
    1,
    'start-ellipsis',
    4,
    5,
    6,
    'end-ellipsis',
    10,
  ])
  assert.deepEqual(customerPageItems(10, 10), [
    1,
    'start-ellipsis',
    6,
    7,
    8,
    9,
    10,
  ])
  assert.deepEqual(customerPageItems(99, 8), [
    1,
    'start-ellipsis',
    4,
    5,
    6,
    7,
    8,
  ])
})

test('details accept canonical UUIDs only and initials stay presentation-only', () => {
  assert.equal(isCustomerId('00000000-0000-4000-8000-000000000001'), true)
  assert.equal(isCustomerId('demo-customer'), false)
  assert.equal(isCustomerId('00000000-0000-4000-8000-000000000001/evil'), false)
  assert.equal(
    customerInitials('Example Customer', 'customer@example.test'),
    'EC',
  )
  assert.equal(customerInitials('', 'customer@example.test'), 'CU')
  assert.equal(customerInitials(' A ', 'a@example.test'), 'A')
})
