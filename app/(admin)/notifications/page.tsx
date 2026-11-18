import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { NotificationInbox } from '@/components/notifications/inbox'
export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading notifications section" />
      }
    >
      <NotificationInbox />
    </Suspense>
  )
}
