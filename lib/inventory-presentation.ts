import type { Balance } from '@/lib/api/catalog'

export type InventoryStatus = 'NO_AVAILABLE_STOCK' | 'LOW_STOCK' | 'HEALTHY'

export type InventoryPageSummary = {
  skuCount: number
  physicalUnits: number
  reservedUnits: number
  lowStockCount: number
  noAvailableStockCount: number
}

/** Derive display-only totals from the currently loaded page, never as global stock truth. */
export function summarizeInventoryPage(items: Balance[]): InventoryPageSummary {
  return items.reduce<InventoryPageSummary>(
    (summary, item) => {
      summary.skuCount += 1
      summary.physicalUnits += item.onHand
      summary.reservedUnits += item.reservedQuantity
      if (item.lowStock) summary.lowStockCount += 1
      if (item.availableQuantity <= 0) summary.noAvailableStockCount += 1
      return summary
    },
    {
      skuCount: 0,
      physicalUnits: 0,
      reservedUnits: 0,
      lowStockCount: 0,
      noAvailableStockCount: 0,
    },
  )
}

/** Search only the loaded page; server-side UUID and low-stock filters remain authoritative. */
export function filterInventoryPage(
  items: Balance[],
  query: string,
): Balance[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return items
  return items.filter((item) =>
    [item.sku, item.title, item.productId, item.variantId || '']
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalized),
  )
}

/** Available stock can be zero while physical units are reserved, so avoid claiming physical stock is zero. */
export function inventoryStatus(item: Balance): InventoryStatus {
  if (item.availableQuantity <= 0) return 'NO_AVAILABLE_STOCK'
  if (item.lowStock) return 'LOW_STOCK'
  return 'HEALTHY'
}
