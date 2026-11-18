import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Products } from '@/components/catalog/products'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Products' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading products section" />
      }
    >
      <Products />
    </Suspense>
  )
}
