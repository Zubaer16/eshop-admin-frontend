import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveReports } from '@/components/management/reports'
import type { Metadata } from 'next'
import { Reports } from '@/components/admin/reports'
export const metadata: Metadata = {
  title: 'Analytics & Reports | eShop Admin',
}
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveReports />
      </Suspense>
    )
  return <Reports />
}
