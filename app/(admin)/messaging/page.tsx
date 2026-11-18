import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Messaging } from '@/components/management/push-campaigns'
export default function MessagingPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading messaging section" />
      }
    >
      <Messaging />
    </Suspense>
  )
}
