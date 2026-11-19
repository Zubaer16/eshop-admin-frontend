export type OrderPaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

export function getOrderPaginationItems(
  currentPage: number,
  totalPages: number,
): OrderPaginationItem[] {
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
