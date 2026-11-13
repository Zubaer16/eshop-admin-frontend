import { Suspense } from 'react'
import { Products } from '@/components/catalog/products'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Products' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Products />
      </Suspense>
    )
}
