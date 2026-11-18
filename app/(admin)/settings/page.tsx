import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Settings } from '@/components/management/settings'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Store Settings' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="form" label="Loading settings section" />
      }
    >
      <Settings />
    </Suspense>
  )
}
