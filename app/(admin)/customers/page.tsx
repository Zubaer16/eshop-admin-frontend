import { Suspense } from 'react'
import { Customers } from '@/components/customers/customers'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Customers' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Customers />
      </Suspense>
    )
}
