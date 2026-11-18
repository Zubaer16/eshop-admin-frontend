import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Dashboard } from '@/components/management/reports'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Dashboard' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="dashboard" label="Loading dashboard section" />
      }
    >
      <Dashboard />
    </Suspense>
  )
}
