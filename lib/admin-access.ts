import type { ApiUser } from './api/runtime'
export const sectionAccess: Record<string, string[] | 'OWNER'> = {
  '/media': ['catalog.manage'],
  '/dashboard': ['dashboard.view'],
  '/products': [],
  '/categories': [],
  '/inventory': [],
  '/orders': ['orders.manage'],
  '/customers': ['customers.view'],
  '/promotions': ['marketing.manage'],
  '/content': ['marketing.manage'],
  '/shipping': ['shipping.manage'],
  '/payments': ['payments.view'],
  '/reports': [
    'payments.view',
    'orders.manage',
    'inventory.adjust',
    'activity.view',
  ],
  '/staff': 'OWNER',
  '/settings': 'OWNER',
  '/activity': ['activity.view'],
  '/alignment': 'OWNER',
}
export function canVisit(pathname: string, user: ApiUser | null) {
  if (!user || user.role === 'CUSTOMER') return false
  const key = Object.keys(sectionAccess).find(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
  if (!key) return false
  const rule = sectionAccess[key]
  if (user.role === 'OWNER') return true
  return (
    rule !== 'OWNER' &&
    (!rule.length ||
      rule.some((permission) => user.permissions.includes(permission)))
  )
}
