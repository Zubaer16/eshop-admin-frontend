import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Payments } from '@/components/commerce/payments'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Payment reporting',
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading payments section" />
      }
    >
      <Payments />
    </Suspense>
  )
}
