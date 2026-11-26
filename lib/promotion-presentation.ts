/** Convert an API ISO timestamp to a UTC datetime-local field value. */
export function toUtcDateTimeInput(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part: number) => String(part).padStart(2, '0')
  const base = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  const milliseconds = date.getUTCMilliseconds()
  return milliseconds
    ? `${base}.${String(milliseconds).padStart(3, '0')}`
    : base
}

/** Interpret a datetime-local field as UTC and send an explicit ISO instant. */
export function fromUtcDateTimeInput(value: string): string | null {
  if (!value.trim()) return null
  const date = new Date(`${value}Z`)
  if (Number.isNaN(date.getTime()))
    throw new Error('Enter a valid UTC date and time.')
  return date.toISOString()
}

/** Percentage coupon values are basis points: 1000 bps = 10%. */
export function formatBasisPoints(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) return 'Unavailable'
  const whole = Math.floor(value / 100)
  const fraction = value % 100
  if (!fraction) return `${whole.toLocaleString('en-US')}%`
  const decimal = String(fraction).padStart(2, '0').replace(/0$/, '')
  return `${whole.toLocaleString('en-US')}.${decimal}%`
}

export function shortPromotionId(value: string): string {
  return value.slice(0, 8).toUpperCase()
}
