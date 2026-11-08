import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveOrders } from '@/components/orders/orders'
import type { Metadata } from 'next'
import { Orders } from '@/components/admin/orders'
export const metadata: Metadata = { title: 'Orders' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveOrders />
      </Suspense>
    )
  return <Orders />
}
