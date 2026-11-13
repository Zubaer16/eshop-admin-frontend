import { Suspense } from 'react'
import { AuditActivity } from '@/components/management/reports'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Activity',
}
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <AuditActivity />
      </Suspense>
    )
}
