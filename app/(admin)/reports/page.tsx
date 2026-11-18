import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Reports } from '@/components/management/reports'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Analytics & Reports | eShop Admin',
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="dashboard" label="Loading reports section" />
      }
    >
      <Reports />
    </Suspense>
  )
}
