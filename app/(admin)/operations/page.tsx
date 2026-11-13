import { Suspense } from 'react'
import { Operations } from '@/components/management/settings'
export default function OperationsPage() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Operations />
      </Suspense>
    )
}
