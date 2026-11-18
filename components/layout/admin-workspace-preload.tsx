'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { adminOwner, prefetchAdminWorkspace } from '@/lib/admin-cache'

export function AdminWorkspacePreload() {
  const { session } = useAuth()
  const owner = adminOwner(session)

  useEffect(() => {
    if (owner) prefetchAdminWorkspace(owner)
  }, [owner])

  return null
}
