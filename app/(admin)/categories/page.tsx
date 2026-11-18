import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Categories } from '@/components/catalog/categories'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Categories' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading categories section" />
      }
    >
      <Categories />
    </Suspense>
  )
}
