import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Orders } from '@/components/orders/orders'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Orders' }
export default function Page() {
  return (
    <Suspense
      fallback={<PageSkeleton variant="table" label="Loading orders section" />}
    >
      <Orders />
    </Suspense>
  )
}
