'use client'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { api } from '@/lib/api/client'
import { adminCache, adminOwner, adminQueryKey } from '@/lib/admin-cache'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import type { Page } from '@/lib/api/catalog'

export const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The request could not be completed.'

export function useResource<T>(
  route: string,
  query: Record<string, string | number | undefined> = {},
) {
  const { session } = useAuth()
  const owner = adminOwner(session)
  const queryKey = adminQueryKey(query)
  const stableQuery = useMemo(
    () =>
      Object.fromEntries(JSON.parse(queryKey)) as Record<
        string,
        string | number | undefined
      >,
    [queryKey],
  )
  const cacheable = adminCache.isCacheable(route)
  const cacheVersion = useSyncExternalStore(
    adminCache.subscribe,
    adminCache.getVersion,
    adminCache.getServerVersion,
  )
  const invalidationVersion = useSyncExternalStore(
    adminCache.subscribe,
    adminCache.getInvalidationVersion,
    adminCache.getServerInvalidationVersion,
  )
  const [localData, setLocalData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)
  const refreshGeneration = cacheable ? invalidationVersion : 0

  useEffect(() => {
    let active = true
    setError('')
    if (cacheable) {
      void adminCache.read<T>(route, stableQuery).catch((reason) => {
        if (active) setError(message(reason))
      })
      return () => {
        active = false
      }
    }

    const controller = new AbortController()
    setLocalData(null)
    api
      .request<T>(route, { query: stableQuery, signal: controller.signal })
      .then((value) => {
        if (active) setLocalData(value)
      })
      .catch((reason) => {
        if (active) setError(message(reason))
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [
    route,
    queryKey,
    owner,
    cacheable,
    refreshGeneration,
    reloadVersion,
    stableQuery,
  ])

  const reload = useCallback(() => {
    setError('')
    if (cacheable) {
      void adminCache.read<T>(route, stableQuery, true).catch((reason) => {
        setError(message(reason))
      })
    } else {
      setReloadVersion((value) => value + 1)
    }
  }, [route, cacheable, stableQuery])

  const data = cacheable ? adminCache.peek<T>(route, stableQuery) : localData
  const isRefreshing = cacheable && adminCache.isPending(route, stableQuery)
  // The cache version is intentionally a render subscription; data is read from the cache above.
  void cacheVersion
  return { data, error, reload, isRefreshing }
}

export function ErrorMessage({ text }: { text: string }) {
  return text ? (
    <p
      role="alert"
      className="my-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      {text}
    </p>
  ) : null
}
export function ResourceState({
  error,
  retry,
}: {
  error: string
  retry: () => void
}) {
  return error ? (
    <div>
      <ErrorMessage text={error} />
      <Button variant="secondary" onClick={retry}>
        Retry loading
      </Button>
    </div>
  ) : (
    <p role="status" className="p-6 text-sm text-muted">
      Loading current data…
    </p>
  )
}
export function Pagination({
  data,
  change,
}: {
  data: Page<unknown>
  change: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line p-4 text-sm">
      <span>
        {data.total} results · Page {data.page} of {Math.max(1, data.pages)}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={data.page <= 1}
          onClick={() => change(data.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={data.page >= data.pages}
          onClick={() => change(data.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
