import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterInventoryPage,
  inventoryStatus,
  summarizeInventoryPage,
} from '../lib/inventory-presentation.ts'

const balance = (overrides = {}) => ({
  id: 'balance-1',
  productId: 'product-1',
  variantId: null,
  sku: 'TSH-MEN-001',
  title: 'Classic Cotton T-Shirt',
  onHand: 20,
  reservedQuantity: 4,
  availableQuantity: 16,
  lowStockThreshold: 5,
  lowStock: false,
  ...overrides,
})

test('inventory summary is explicitly calculated from the supplied page only', () => {
  const summary = summarizeInventoryPage([
    balance(),
    balance({
      id: 'balance-2',
      sku: 'BEAU-SKIN-001',
      onHand: 8,
      reservedQuantity: 3,
      availableQuantity: 5,
      lowStock: true,
    }),
  ])
  assert.deepEqual(summary, {
    skuCount: 2,
    physicalUnits: 28,
    reservedUnits: 7,
    lowStockCount: 1,
    noAvailableStockCount: 0,
  })
})

test('inventory page search matches SKU, product title and identifiers', () => {
  const items = [
    balance(),
    balance({
      id: 'balance-2',
      sku: 'BEAU-SKIN-001',
      title: 'Hydrating Face Moisturizer',
    }),
  ]
  assert.deepEqual(
    filterInventoryPage(items, 'beau-skin').map((item) => item.id),
    ['balance-2'],
  )
  assert.deepEqual(
    filterInventoryPage(items, 'hydrating face').map((item) => item.id),
    ['balance-2'],
  )
  assert.deepEqual(
    filterInventoryPage(items, 'product-1').map((item) => item.id),
    ['balance-1', 'balance-2'],
  )
  assert.equal(filterInventoryPage(items, '  ').length, 2)
})

test('inventory status distinguishes no available stock from low and healthy stock', () => {
  assert.equal(
    inventoryStatus(
      balance({ availableQuantity: 0, onHand: 12, reservedQuantity: 12 }),
    ),
    'NO_AVAILABLE_STOCK',
  )
  assert.equal(
    inventoryStatus(balance({ lowStock: true, availableQuantity: 2 })),
    'LOW_STOCK',
  )
  assert.equal(inventoryStatus(balance()), 'HEALTHY')
})
