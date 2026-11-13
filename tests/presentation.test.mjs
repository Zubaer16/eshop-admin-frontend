import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMinor, displayDate } from '../lib/presentation.ts'
test('currency display preserves exact integer totals and currency precision', () => {
  assert.equal(
    formatMinor('900719925474099301', 'USD'),
    '$9,007,199,254,740,993.01',
  )
  assert.equal(formatMinor('-1', 'USD'), '-$0.01')
  assert.equal(formatMinor('1234', 'JPY'), '¥1,234')
  assert.equal(formatMinor('1234', 'KWD'), 'KWD 1.234')
  assert.equal(formatMinor(null, 'USD'), 'Unavailable')
  assert.equal(formatMinor('1.5', 'USD'), 'Unavailable')
  assert.equal(displayDate('2026-11-13T23:59:00Z'), 'Nov 13, 2026')
})
