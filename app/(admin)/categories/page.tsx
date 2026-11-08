import { Suspense } from 'react'
import { isPreviewMode } from '@/lib/integration-mode'
import { LiveCategories } from '@/components/catalog/categories'
import type { Metadata } from 'next'
import { Categories } from '@/components/admin/categories'
export const metadata: Metadata = { title: 'Categories' }
export default function Page() {
  if (!isPreviewMode)
    return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <LiveCategories />
      </Suspense>
    )
  return <Categories />
}
