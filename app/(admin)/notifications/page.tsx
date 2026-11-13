import { Suspense } from 'react'
import { NotificationInbox } from '@/components/notifications/inbox'
export default function NotificationsPage() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <NotificationInbox />
      </Suspense>
    )
}
