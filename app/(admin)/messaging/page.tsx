import { Suspense } from 'react'
import { Messaging } from '@/components/management/push-campaigns'
export default function MessagingPage() {
  return (
      <Suspense fallback={<p role="status">Loading section...</p>}>
        <Messaging />
      </Suspense>
    )
}
