'use client'
import { api } from './api/client'
import { subscribeAdminMutations } from './admin-cache-events'
import { createAdminCache } from './admin-cache-core'
import type { Query } from './admin-cache-core'
export { createAdminCache, adminOwner, adminQueryKey } from './admin-cache-core'

export const adminCache = createAdminCache({
  session: () => api.getSnapshot(),
  request: (route, query) => api.request(route, { query }),
})

api.subscribe(adminCache.syncSession)
subscribeAdminMutations(adminCache.invalidateAll)

if (typeof window !== 'undefined') {
  const refreshVisibleData = () => {
    if (document.visibilityState === 'visible') adminCache.invalidateAll()
  }
  window.addEventListener('focus', refreshVisibleData)
  document.addEventListener('visibilitychange', refreshVisibleData)
}

const prefetchPlan: Record<string, readonly [string, Query?][]> = {
  '/dashboard': [['/v1/admin/dashboard/overview']],
  '/products': [
    ['/v1/admin/products', { page: 1, limit: 20 }],
    ['/v1/admin/categories'],
  ],
  '/categories': [['/v1/admin/categories']],
  '/inventory': [['/v1/admin/inventory', { page: 1, limit: 20 }]],
  '/orders': [['/v1/admin/orders', { page: 1, limit: 20 }]],
  '/promotions': [['/v1/admin/promotions/coupons', { page: 1, limit: 20 }]],
  '/content': [['/v1/admin/store/banners', { page: 1, limit: 20 }]],
  '/media': [['/v1/admin/media', { page: 1, limit: 12, status: 'ACTIVE' }]],
  '/shipping': [
    ['/v1/admin/checkout/rates'],
    ['/v1/admin/checkout/zones'],
    ['/v1/admin/checkout/defaults'],
  ],
}

export function prefetchAdminRoute(href: string) {
  for (const [route, query] of prefetchPlan[href] ?? [])
    adminCache.prefetch(route, query)
}
