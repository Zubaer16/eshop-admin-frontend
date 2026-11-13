import { Suspense } from 'react'
import { Orders } from '@/components/orders/orders'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Orders' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Orders />
      </Suspense>
    )
}
