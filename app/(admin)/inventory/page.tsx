import { Suspense } from 'react'
import { Inventory } from '@/components/catalog/inventory'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Inventory' }
export default function Page() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Inventory />
      </Suspense>
    )
}
