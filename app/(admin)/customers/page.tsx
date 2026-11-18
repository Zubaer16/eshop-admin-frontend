import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Customers } from '@/components/customers/customers'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Customers' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading customers section" />
      }
    >
      <Customers />
    </Suspense>
  )
}
