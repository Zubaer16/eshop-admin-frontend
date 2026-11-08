import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveProducts } from '@/components/catalog/products'
import type { Metadata } from 'next'
import { Products } from '@/components/admin/products'
export const metadata: Metadata = { title: 'Products' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveProducts />
      </Suspense>
    )
  return <Products />
}
