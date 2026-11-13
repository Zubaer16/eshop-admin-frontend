import { Suspense } from 'react'
import { Promotions } from '@/components/commerce/promotions'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Promotions' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Promotions />
      </Suspense>
    )
}
