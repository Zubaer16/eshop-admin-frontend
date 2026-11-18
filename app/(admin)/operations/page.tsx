import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Operations } from '@/components/management/settings'
export default function OperationsPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading operations section" />
      }
    >
      <Operations />
    </Suspense>
  )
}
