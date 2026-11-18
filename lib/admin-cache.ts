'use client'
import { api } from './api/client'
import { canVisit } from './admin-access'
import { subscribeAdminMutations } from './admin-cache-events'
import { bindAdminCacheVisibilityRefresh } from './admin-cache-lifecycle'
import { createAdminCache, adminOwner } from './admin-cache-core'
import type { Query } from './admin-cache-core'
import {
  adminPrefetchPath,
  canPrefetchAdminPath,
  getAdminInventoryPrefetchPlan,
  getAdminPrefetchPlan,
  getAdminProductPrefetchPlan,
  getAdminPromotionCampaignPrefetchPlan,
  getAdminWorkspacePreloadRoutes,
} from './admin-prefetch-core'
export { createAdminCache, adminOwner, adminQueryKey } from './admin-cache-core'

export const adminCache = createAdminCache({
  session: () => api.getSnapshot(),
  request: (route, query) => api.request(route, { query }),
})

api.subscribe(adminCache.syncSession)
subscribeAdminMutations(adminCache.invalidateAll)

if (typeof document !== 'undefined') {
  // Window focus can fire during ordinary browser interactions. Refresh only
  // after a real hidden -> visible transition, and only for mounted resources.
  bindAdminCacheVisibilityRefresh(adminCache, document)
}

function runPrefetchPlan(plan: readonly (readonly [string, Query?])[]) {
  for (const [route, query] of plan) adminCache.prefetch(route, query)
}

export function prefetchAdminRoute(href: string) {
  const session = api.getSnapshot()
  if (session.status !== 'authenticated' || !session.user) return
  const path = adminPrefetchPath(href)
  if (!path || !canPrefetchAdminPath(path, session.user, canVisit)) return
  runPrefetchPlan(getAdminPrefetchPlan(path))
}

export function prefetchAdminWorkspace(expectedOwner?: string) {
  const session = api.getSnapshot()
  const owner = adminOwner(session)
  if (!owner || (expectedOwner && owner !== expectedOwner) || !session.user)
    return
  for (const route of getAdminWorkspacePreloadRoutes())
    if (canPrefetchAdminPath(route, session.user, canVisit))
      prefetchAdminRoute(route)
}

export function prefetchAdminProduct(id: string) {
  const session = api.getSnapshot()
  if (
    session.status !== 'authenticated' ||
    !canPrefetchAdminPath('/products', session.user, canVisit)
  )
    return
  runPrefetchPlan(getAdminProductPrefetchPlan(id))
}

export function prefetchAdminInventoryBalance(id: string) {
  const session = api.getSnapshot()
  if (
    session.status !== 'authenticated' ||
    !canPrefetchAdminPath('/inventory', session.user, canVisit)
  )
    return
  runPrefetchPlan(getAdminInventoryPrefetchPlan(id))
}

export function prefetchAdminPromotionCampaigns() {
  const session = api.getSnapshot()
  if (
    session.status !== 'authenticated' ||
    !canPrefetchAdminPath('/promotions', session.user, canVisit)
  )
    return
  runPrefetchPlan(getAdminPromotionCampaignPrefetchPlan())
}
