import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Media library' }
export default function MediaPage() {
  return (
    <p className="p-6 text-sm">
      The verified media library is available in live mode.
    </p>
  )
}
