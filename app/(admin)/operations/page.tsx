import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveOperations } from '@/components/management/settings'
export default function OperationsPage() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveOperations />
      </Suspense>
    )
  return <p className="p-6 text-sm">This section is available in live mode.</p>
}
