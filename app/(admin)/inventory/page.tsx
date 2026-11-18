import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Inventory } from '@/components/catalog/inventory'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Inventory' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading inventory section" />
      }
    >
      <Inventory />
    </Suspense>
  )
}
