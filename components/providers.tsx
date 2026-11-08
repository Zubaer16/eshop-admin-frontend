'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { AuthProvider } from '@/components/auth/auth-provider'
import { isPreviewMode } from '@/lib/integration-mode'
import { useAdminStore } from '@/lib/store'

const ReadyContext = createContext(false)

export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isPreviewMode) {
      document.documentElement.setAttribute('data-admin-ready', 'true')
      setReady(true)
      return
    }
    let active = true

    // Zustand can return void for synchronous storage or a Promise for async storage.
    void Promise.resolve(useAdminStore.persist.rehydrate()).then(() => {
      if (!active) return
      document.documentElement.setAttribute('data-admin-ready', 'true')
      setReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <AuthProvider>
      <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>
    </AuthProvider>
  )
}

export const useAdminReady = () => useContext(ReadyContext)
