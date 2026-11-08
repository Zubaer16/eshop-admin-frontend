import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveStaff } from '@/components/management/staff'
import type { Metadata } from 'next'
import { Staff } from '@/components/admin/staff'
export const metadata: Metadata = { title: 'Staff & Permissions' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveStaff />
      </Suspense>
    )
  return <Staff />
}
