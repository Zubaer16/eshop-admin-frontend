import { Suspense } from 'react'
import { MediaPage as MediaWorkspace } from '@/components/catalog/media'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Media library' }
export default function MediaPage() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <MediaWorkspace />
      </Suspense>
    )
  return (
    <p className="p-6 text-sm">
      The verified media library is available in live mode.
    </p>
  )
}
