import type { ApiUser } from './api/runtime'
import type { Query } from './admin-cache-core'

export type AdminPrefetchRequest = readonly [string, Query?]
export type AdminSectionCheck = (path: string, user: ApiUser | null) => boolean

const routePlans: Record<string, readonly AdminPrefetchRequest[]> = {
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
  '/messaging': [['/v1/admin/push/campaigns', { page: 1, limit: 20 }]],
}

const workspacePriority = ['/dashboard', '/categories', '/orders'] as const
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

export function adminPrefetchPath(href: string): string | null {
  if (
    typeof href !== 'string' ||
    !href.startsWith('/') ||
    href.startsWith('//') ||
    href.includes('\\') ||
    /[\u0000-\u0020\u007f]/.test(href)
  )
    return null
  const path = href.split(/[?#]/, 1)[0]
  return path.replace(/\/+$/, '') || '/'
}

export function canPrefetchAdminPath(
  path: string,
  user: ApiUser | null,
  sectionCheck: AdminSectionCheck,
) {
  if (!user || !sectionCheck(path, user)) return false
  // The Shipping page deliberately renders its configuration editor for OWNER only.
  if (path === '/shipping' && user.role !== 'OWNER') return false
  return true
}

export function getAdminPrefetchPlan(
  path: string,
): readonly AdminPrefetchRequest[] {
  return routePlans[path] ?? []
}

export function getAdminWorkspacePreloadRoutes() {
  return workspacePriority
}

export function getAdminProductPrefetchPlan(
  id: string,
): readonly AdminPrefetchRequest[] {
  if (!uuid.test(id)) return []
  return [[`/v1/admin/products/${id.toLowerCase()}`]]
}

export function getAdminInventoryPrefetchPlan(
  id: string,
): readonly AdminPrefetchRequest[] {
  if (!uuid.test(id)) return []
  const route = `/v1/admin/inventory/${id.toLowerCase()}`
  return [[route], [route + '/movements', { page: 1, limit: 10 }]]
}

export function getAdminPromotionCampaignPrefetchPlan(): readonly AdminPrefetchRequest[] {
  return [['/v1/admin/promotions/campaigns', { page: 1, limit: 20 }]]
}
