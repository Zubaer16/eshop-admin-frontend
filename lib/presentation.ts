/** Exact display only: server amounts remain authoritative, including integer strings. */
export function formatMinor(value: unknown, currency: string) {
  const text = String(value ?? '')
  if (!/^-?\d+$/.test(text) || !/^[A-Z]{3}$/.test(currency))
    return 'Unavailable'
  const amount = BigInt(text),
    negative = amount < BigInt(0),
    absolute = negative ? -amount : amount
  const format = new Intl.NumberFormat('en-US', { style: 'currency', currency })
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2
  const scale = BigInt(10) ** BigInt(digits)
  const whole = new Intl.NumberFormat('en-US').format(absolute / scale)
  const fraction = String(absolute % scale).padStart(digits, '0')
  return format
    .formatToParts(negative ? -1 : 1)
    .map((part) =>
      part.type === 'integer'
        ? whole
        : part.type === 'fraction'
          ? fraction
          : part.value,
    )
    .join('')
}
export function displayLabel(key: string) {
  const names: Record<string, string> = {
    id: 'Reference',
    key: 'Role',
    paidMinor: 'Collected',
    refundedMinor: 'Refunded',
    netCollectedMinor: 'Net collected',
    totalMinor: 'Order total',
    priceMinor: 'Price',
    title: 'Product',
    createdAt: 'Created',
    onHand: 'Physical stock',
    reservedQuantity: 'Reserved',
    expectedRevision: 'Current version',
  }
  return (
    names[key] ||
    key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/^./, (c) => c.toUpperCase())
  )
}
export function displayDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        timeZone: 'UTC',
      }).format(date)
}
