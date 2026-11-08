import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveMessaging } from '@/components/management/push-campaigns'
export default function MessagingPage() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveMessaging />
      </Suspense>
    )
  return <p className="p-6 text-sm">This section is available in live mode.</p>
}
