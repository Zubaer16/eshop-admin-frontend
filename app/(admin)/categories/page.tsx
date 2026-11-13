import { Suspense } from 'react'
import { Categories } from '@/components/catalog/categories'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Categories' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Categories />
      </Suspense>
    )
}
