import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Promotions } from '@/components/commerce/promotions'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Promotions' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading promotions section" />
      }
    >
      <Promotions />
    </Suspense>
  )
}
