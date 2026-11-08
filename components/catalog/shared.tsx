'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import type { Page } from '@/lib/api/catalog'

export const message = (error: unknown) =>
  error instanceof Error ? error.message : 'The request could not be completed.'
export function useResource<T>(
  route: string,
  query: Record<string, string | number | undefined> = {},
) {
  const key = JSON.stringify(query)
  const [revision, setRevision] = useState(0),
    [data, setData] = useState<T | null>(null),
    [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setData(null)
    setError('')
    api
      .request<T>(route, { query: JSON.parse(key), signal: controller.signal })
      .then((value) => {
        if (active) setData(value)
      })
      .catch((error) => {
        if (active) setError(message(error))
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [route, key, revision])
  return { data, error, reload: () => setRevision((value) => value + 1) }
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
