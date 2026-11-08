import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveContent } from '@/components/management/content'
import type { Metadata } from 'next'
import { StoreContent } from '@/components/admin/store-content'
export const metadata: Metadata = { title: 'Store content' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveContent />
      </Suspense>
    )
  return <StoreContent />
}
