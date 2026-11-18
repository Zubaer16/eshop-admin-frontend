'use client'
import { AuthProvider } from '@/components/auth/auth-provider'
import { NavigationProvider } from '@/components/layout/navigation-provider'

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <AuthProvider>{children}</AuthProvider>
    </NavigationProvider>
  )
}
