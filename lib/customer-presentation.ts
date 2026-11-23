// Customers has no `pages` response field; page windows use only the
// Backend-authoritative total, page and limit from the directory response.
export type CustomerPageItem = number | 'start-ellipsis' | 'end-ellipsis'

export function customerPageCount(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit))
}

export function customerResultRange(
  total: number,
  page: number,
  limit: number,
): { start: number; end: number } {
  if (total === 0) return { start: 0, end: 0 }
  return {
    start: (page - 1) * limit + 1,
    end: Math.min(page * limit, total),
  }
}

export function customerPageItems(
  currentPage: number,
  totalPages: number,
): CustomerPageItem[] {
  const pages = Math.max(1, Math.floor(totalPages))
  const current = Math.min(pages, Math.max(1, Math.floor(currentPage)))

  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, 'end-ellipsis', pages]
  if (current >= pages - 3)
    return [
      1,
      'start-ellipsis',
      pages - 4,
      pages - 3,
      pages - 2,
      pages - 1,
      pages,
    ]
  return [
    1,
    'start-ellipsis',
    current - 1,
    current,
    current + 1,
    'end-ellipsis',
    pages,
  ]
}

export const isCustomerId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value)

export function customerInitials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (email.split('@')[0] || 'C').slice(0, 2).toUpperCase()
}
