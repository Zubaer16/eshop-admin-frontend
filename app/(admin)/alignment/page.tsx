import { Suspense } from 'react'
import { Compatibility } from '@/components/management/alignment'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Frontend Compatibility' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Compatibility />
      </Suspense>
    )
}
