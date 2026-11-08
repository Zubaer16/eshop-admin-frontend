import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveActivity } from '@/components/management/reports'
import type { Metadata } from 'next'
import { Activity } from '@/components/admin/activity'
export const metadata: Metadata = {
  title: isPreviewMode ? 'Local Activity' : 'Activity',
}
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveActivity />
      </Suspense>
    )
  return <Activity />
}
