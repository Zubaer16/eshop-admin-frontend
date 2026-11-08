import type { Metadata } from 'next'
import { SignInForm } from '@/components/auth/sign-in-form'
export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}
export default function Page() {
  return <SignInForm staff />
}
