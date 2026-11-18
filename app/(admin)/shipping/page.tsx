import { Suspense } from 'react'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Shipping } from '@/components/commerce/shipping'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Shipping & taxes' }
export default function Page() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="table" label="Loading shipping section" />
      }
    >
      <Shipping />
    </Suspense>
  )
}
