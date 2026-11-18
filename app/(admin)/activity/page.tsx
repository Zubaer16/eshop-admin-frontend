import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AuditActivity } from '@/components/management/reports'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Activity',
}
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading activity section" />
      }
    >
      <AuditActivity />
    </Suspense>
  )
}
