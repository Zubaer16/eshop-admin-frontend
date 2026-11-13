import { Suspense } from 'react'
import { Staff } from '@/components/management/staff'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Staff & Permissions' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Staff />
      </Suspense>
    )
}
