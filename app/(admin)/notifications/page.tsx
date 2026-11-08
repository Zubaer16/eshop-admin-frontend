import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveInbox } from '@/components/notifications/inbox'
export default function NotificationsPage() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveInbox />
      </Suspense>
    )
  return <p className="p-6 text-sm">This section is available in live mode.</p>
}
