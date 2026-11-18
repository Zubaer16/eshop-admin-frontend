import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { MediaPage as MediaWorkspace } from '@/components/catalog/media'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Media library' }
export default function MediaPage() {
  return (
    <Suspense
      fallback={<PageSkeleton variant="grid" label="Loading media section" />}
    >
      <MediaWorkspace />
    </Suspense>
  )
  return (
    <p className="p-6 text-sm">
      The verified media library is available in live mode.
    </p>
  )
}
