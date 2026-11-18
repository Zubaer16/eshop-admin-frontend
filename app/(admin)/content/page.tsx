import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { StoreContent } from '@/components/management/content'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Store content' }
export default function Page() {
  return (
    <Suspense
      fallback={<PageSkeleton variant="grid" label="Loading content section" />}
    >
      <StoreContent />
    </Suspense>
  )
}
