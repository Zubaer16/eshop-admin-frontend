import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveInventory } from '@/components/catalog/inventory'
import type { Metadata } from 'next'
import { Inventory } from '@/components/admin/inventory'
export const metadata: Metadata = { title: 'Inventory' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveInventory />
      </Suspense>
    )
  return <Inventory />
}
