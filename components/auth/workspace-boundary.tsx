'use client'
import { usePathname } from 'next/navigation'
import { isPreviewMode } from '@/lib/integration-mode'
import { canVisit } from '@/lib/admin-access'
import { useAuth } from './auth-provider'
import { Suspense } from 'react'
import { LiveProducts } from '@/components/catalog/products'
import { LiveCategories } from '@/components/catalog/categories'
import { LiveInventory } from '@/components/catalog/inventory'
import { LiveMedia } from '@/components/catalog/media'
import { LiveCustomers } from '@/components/customers/customers'
import { LiveShipping } from '@/components/commerce/shipping'
import { LivePromotions } from '@/components/commerce/promotions'
import { LivePayments } from '@/components/commerce/payments'
export function WorkspaceBoundary({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    { session } = useAuth()
  if (isPreviewMode) return children
  if (!canVisit(path, session.user))
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-7">
        <h1 className="text-2xl font-black">Access restricted</h1>
        <p role="alert" className="mt-3 text-sm text-slate-600">
          Your current account cannot open this section. Contact the store owner
          if you need access.
        </p>
      </section>
    )
  if (path === '/products') return <LiveProducts />
  if (path === '/categories') return <LiveCategories />
  if (path === '/inventory')
    return (
      <Suspense fallback={<p role="status">Loading inventory…</p>}>
        <LiveInventory />
      </Suspense>
    )
  if (path === '/media') return <LiveMedia />
  if (path === '/customers') return <LiveCustomers />
  if (path === '/shipping') return <LiveShipping />
  if (path === '/promotions') return <LivePromotions />
  if (path === '/payments') return <LivePayments />
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-7">
      <h1 className="text-2xl font-black">Workspace ready</h1>
      <p className="mt-3 text-sm text-slate-600">
        You are signed in as <strong>{session.user?.email}</strong>.
      </p>
      <p className="mt-3 text-sm text-slate-600">
        This section is not available yet. Sample records are kept separate from
        your account.
      </p>
    </section>
  )
}
