import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Compatibility } from '@/components/management/alignment'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Frontend Compatibility' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading alignment section" />
      }
    >
      <Compatibility />
    </Suspense>
  )
}
