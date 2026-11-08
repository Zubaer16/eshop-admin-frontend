import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveCustomers } from '@/components/customers/customers'
import type { Metadata } from 'next'
import { Customers } from '@/components/admin/customers'
export const metadata: Metadata = { title: 'Customers' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveCustomers />
      </Suspense>
    )
  return <Customers />
}
