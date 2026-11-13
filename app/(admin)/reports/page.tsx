import { Suspense } from 'react'
import { Reports } from '@/components/management/reports'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Analytics & Reports | eShop Admin',
}
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Reports />
      </Suspense>
    )
}
