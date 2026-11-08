import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveShipping } from '@/components/commerce/shipping'
import type { Metadata } from 'next'
import { Shipping } from '@/components/admin/shipping'
export const metadata: Metadata = { title: 'Shipping & taxes' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveShipping />
      </Suspense>
    )
  return <Shipping />
}
