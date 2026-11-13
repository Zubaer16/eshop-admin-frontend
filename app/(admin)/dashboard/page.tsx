import { Suspense } from 'react'
import { Dashboard } from '@/components/management/reports'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Dashboard' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Dashboard />
      </Suspense>
    )
}
