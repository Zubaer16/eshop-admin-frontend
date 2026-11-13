import { Suspense } from 'react'
import { Payments } from '@/components/commerce/payments'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Payment reporting',
}
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Payments />
      </Suspense>
    )
}
