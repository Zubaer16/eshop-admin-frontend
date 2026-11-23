'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import { usePathname } from 'next/navigation'
import { useNavigationRouter } from '@/components/layout/navigation-provider'
import { api, authChannelName, sessionSource } from '@/lib/api/client'
import type { Session } from '@/lib/api/runtime'
import { bindAdminIdentityRevalidation } from '@/lib/auth-identity-lifecycle'
import { AdminSessionLoader } from './admin-session-loader'
const Context = createContext<{ session: Session; ready: boolean } | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(
    api.subscribe,
    api.getSnapshot,
    api.getServerSnapshot,
  )
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    void api.restoreSession().finally(() => {
      if (active) setReady(true)
    })
    const channel =
      typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel(authChannelName)
    if (channel)
      channel.onmessage = (event) => {
        if (
          event.data?.source === sessionSource ||
          !['login', 'logout'].includes(event.data?.type)
        )
          return
        api.clearLocalSession()
        if (event.data.type === 'login')
          void api.restoreSession().then(() => api.restoreSession())
      }
    const unbindIdentityRevalidation = bindAdminIdentityRevalidation(
      () => {
        if (api.getSnapshot().status === 'authenticated')
          return api.refreshIdentity()
        return Promise.resolve()
      },
      document,
      { focusTarget: window },
    )
    return () => {
      active = false
      channel?.close()
      unbindIdentityRevalidation()
    }
  }, [])
  return (
    <Context.Provider value={{ session, ready }}>{children}</Context.Provider>
  )
}
export function useAuth() {
  const value = useContext(Context)
  if (!value) throw new Error('AuthProvider is missing')
  return value
}
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth(),
    pathname = usePathname(),
    router = useNavigationRouter()
  useEffect(() => {
    if (ready && session.status === 'anonymous')
      router.replace('/sign-in?next=' + encodeURIComponent(pathname))
  }, [ready, session.status, pathname, router])
  if (!ready || session.status !== 'authenticated')
    return <AdminSessionLoader />
  return (
    <div
      key={
        session.epoch +
        ':' +
        session.user?.id +
        ':' +
        session.user?.permissions.join(',')
      }
    >
      {children}
    </div>
  )
}
