'use client'

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Router = ReturnType<typeof useRouter>
type NavigationValue = {
  router: Router
  begin: (id: string) => void
  end: (id: string) => void
}

const Navigation = createContext<NavigationValue | null>(null)

function Completion({ commit }: { commit: (path: string) => void }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    commit(pathname + (search ? '?' + search : ''))
  }, [pathname, search, commit])

  return null
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [transitioning, startTransition] = useTransition()
  const [links, setLinks] = useState<Set<string>>(() => new Set())
  const [visible, setVisible] = useState(false)
  const committed = useRef('')

  const begin = useCallback((id: string) => {
    setLinks((current) => {
      if (current.has(id)) return current
      return new Set(current).add(id)
    })
  }, [])

  const end = useCallback((id: string) => {
    setLinks((current) => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }, [])

  const commit = useCallback(
    (path: string) => {
      if (window.location.pathname + window.location.search !== path) return
      committed.current = path
      end('history')
    },
    [end],
  )

  useEffect(() => {
    committed.current = window.location.pathname + window.location.search
    const onPopState = () => {
      if (
        window.location.pathname + window.location.search !==
        committed.current
      ) {
        begin('history')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [begin])

  const pending = transitioning || links.size > 0

  useEffect(() => {
    if (!pending) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(true), 180)
    return () => window.clearTimeout(timer)
  }, [pending])

  const value = useMemo<NavigationValue>(
    () => ({
      begin,
      end,
      router: {
        ...router,
        push: (...args: Parameters<Router['push']>) =>
          startTransition(() => router.push(...args)),
        replace: (...args: Parameters<Router['replace']>) =>
          startTransition(() => router.replace(...args)),
        refresh: () => startTransition(() => router.refresh()),
        back: () => startTransition(() => router.back()),
        forward: () => startTransition(() => router.forward()),
      },
    }),
    [router, begin, end, startTransition],
  )

  return (
    <Navigation.Provider value={value}>
      <Suspense fallback={null}>
        <Completion commit={commit} />
      </Suspense>
      {pending && visible ? (
        <div
          role="progressbar"
          aria-label="Loading page"
          className="admin-navigation-progress"
        >
          <span />
        </div>
      ) : null}
      {children}
    </Navigation.Provider>
  )
}

export function useNavigationRouter() {
  const navigation = useContext(Navigation)
  if (!navigation) throw new Error('NavigationProvider is missing')
  return navigation.router
}

export function useNavigationSignals() {
  const navigation = useContext(Navigation)
  if (!navigation) throw new Error('NavigationProvider is missing')
  return navigation
}
