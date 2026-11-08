import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveSettings } from '@/components/management/settings'
import type { Metadata } from 'next'
import { Settings } from '@/components/admin/settings'
export const metadata: Metadata = { title: 'Store Settings' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveSettings />
      </Suspense>
    )
  return <Settings />
}
