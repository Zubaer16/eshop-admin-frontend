import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Staff } from '@/components/management/staff'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Staff & Permissions' }
export default function Page() {
  return (
    <Suspense
      fallback={<PageSkeleton variant="table" label="Loading staff section" />}
    >
      <Staff />
    </Suspense>
  )
}
