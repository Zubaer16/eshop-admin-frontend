import { Suspense } from 'react'
import { Settings } from '@/components/management/settings'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Store Settings' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Settings />
      </Suspense>
    )
}
