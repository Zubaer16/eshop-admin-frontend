import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveMedia } from '@/components/catalog/media'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Media library' }
export default function MediaPage() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveMedia />
      </Suspense>
    )
  return (
    <p className="p-6 text-sm">
      The verified media library is available in live mode.
    </p>
  )
}
