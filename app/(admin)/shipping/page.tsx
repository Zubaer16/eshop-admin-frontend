import { Suspense } from 'react'
import { Shipping } from '@/components/commerce/shipping'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Shipping & taxes' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Shipping />
      </Suspense>
    )
}
