import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveDashboard } from '@/components/management/reports'
import type { Metadata } from 'next'
import { Dashboard } from '@/components/admin/dashboard'
export const metadata: Metadata = { title: 'Dashboard' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveDashboard />
      </Suspense>
    )
  return <Dashboard />
}
