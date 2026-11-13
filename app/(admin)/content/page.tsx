import { Suspense } from 'react'
import { StoreContent } from '@/components/management/content'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Store content' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <StoreContent />
      </Suspense>
    )
}
