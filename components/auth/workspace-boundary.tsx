'use client'
import { usePathname } from 'next/navigation'
import { isPreviewMode } from '@/lib/integration-mode'
import { canVisit } from '@/lib/admin-access'
import { useAuth } from './auth-provider'
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
  return children
}
