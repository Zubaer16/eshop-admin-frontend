import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LivePromotions } from '@/components/commerce/promotions'
import type { Metadata } from 'next'
import { Promotions } from '@/components/admin/promotions'
export const metadata: Metadata = { title: 'Promotions' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LivePromotions />
      </Suspense>
    )
  return <Promotions />
}
