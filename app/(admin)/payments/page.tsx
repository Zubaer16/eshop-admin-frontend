import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LivePayments } from '@/components/commerce/payments'
import type { Metadata } from 'next'
import { Payments } from '@/components/admin/payments'
export const metadata: Metadata = {
  title: isPreviewMode ? 'Payment reporting preview' : 'Payment reporting',
}
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LivePayments />
      </Suspense>
    )
  return <Payments />
}
