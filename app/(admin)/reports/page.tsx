import type { Metadata } from 'next'
import { Reports } from '@/components/admin/reports'
export const metadata: Metadata = {
  title: 'Analytics & Reports | eShop Admin',
}
export default function Page() {
  return <Reports />
}
