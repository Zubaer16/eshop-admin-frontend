import test from 'node:test'
import assert from 'node:assert/strict'
import { getOrderPaginationItems } from '../lib/order-pagination.ts'

test('shows every page when there are seven or fewer pages', () => {
  assert.deepEqual(getOrderPaginationItems(1, 1), [1])
  assert.deepEqual(getOrderPaginationItems(3, 5), [1, 2, 3, 4, 5])
  assert.deepEqual(getOrderPaginationItems(7, 7), [1, 2, 3, 4, 5, 6, 7])
})

test('keeps the first pages visible and adds a trailing ellipsis', () => {
  assert.deepEqual(getOrderPaginationItems(1, 10), [
    1,
    2,
    3,
    4,
    5,
    'end-ellipsis',
    10,
  ])
})

test('shows the current page and its neighbors between ellipses', () => {
  assert.deepEqual(getOrderPaginationItems(5, 10), [
    1,
    'start-ellipsis',
    4,
    5,
    6,
    'end-ellipsis',
    10,
  ])
})

test('keeps the last pages visible and adds a leading ellipsis', () => {
  assert.deepEqual(getOrderPaginationItems(10, 10), [
    1,
    'start-ellipsis',
    6,
    7,
    8,
    9,
    10,
  ])
})

test('clamps invalid page values to the valid range', () => {
  assert.deepEqual(getOrderPaginationItems(0, 8), [
    1,
    2,
    3,
    4,
    5,
    'end-ellipsis',
    8,
  ])
  assert.deepEqual(getOrderPaginationItems(99, 8), [
    1,
    'start-ellipsis',
    4,
    5,
    6,
    7,
    8,
  ])
})
