import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveAlignment } from '@/components/management/alignment'
import type { Metadata } from 'next'
import { Alignment } from '@/components/admin/alignment'
export const metadata: Metadata = { title: 'Frontend Compatibility' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveAlignment />
      </Suspense>
    )
  return <Alignment />
}
