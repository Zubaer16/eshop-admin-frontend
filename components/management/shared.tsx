'use client'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api/client'
import { formContracts } from '@/lib/api/management-contract'
import {
  useResource,
  ResourceState,
  ErrorMessage,
  Pagination,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/components/commerce/forms'
export type Row = Record<string, unknown>
import { label, formPayload, type Field } from '@/lib/api/management-payload'
export { label, formPayload } from '@/lib/api/management-payload'
export function SpecForm({
  contract,
  row = {},
  route,
  method,
  done,
  title = 'Save changes',
}: {
  contract: keyof typeof formContracts
  row?: Row
  route: string
  method: 'POST' | 'PUT' | 'PATCH'
  done: () => void
  title?: string
}) {
  const fields = formContracts[contract] as unknown as readonly Field[],
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [uncertain, setUncertain] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || uncertain) return
    const form = event.currentTarget
    setError('')
    let sent = false
    try {
      const payload = formPayload(
        fields,
        new FormData(form),
        Number(row.revision || 0),
      )
      if (!window.confirm('Apply these changes to the store?')) return
      setBusy(true)
      if (contract === 'StaffCreateDto') form.reset()
      sent = true
      await api.request(route, { method, body: payload })
      done()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request not confirmed.')
      if (sent) setUncertain(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      onSubmit={submit}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <fieldset
        disabled={busy || uncertain}
        className="grid gap-4 md:grid-cols-2"
      >
        {fields
          .filter((f) => f.key !== 'expectedRevision')
          .map((f) => {
            const value = row[f.key]
            if (f.type === 'boolean')
              return (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={f.key}
                    defaultChecked={value === true}
                  />
                  {label(f.key)}
                </label>
              )
            if (f.type === 'array' && f.items?.enum)
              return (
                <fieldset key={f.key} className="space-y-2">
                  <legend className="font-bold">{label(f.key)}</legend>
                  {f.items.enum.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name={f.key}
                        value={option}
                        defaultChecked={
                          Array.isArray(value) && value.includes(option)
                        }
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              )
            const common = {
              name: f.key,
              required:
                f.required &&
                !f.nullable &&
                (f.type !== 'string' ||
                  Boolean(f.minLength) ||
                  Boolean(f.enum) ||
                  ['password', 'email', 'uuid'].includes(f.format || '')),
              className: fieldClass,
              defaultValue: Array.isArray(value)
                ? value.join(', ')
                : String(value ?? ''),
              minLength: f.minLength,
              maxLength: f.maxLength,
            }
            return (
              <label key={f.key} className="block text-sm font-bold">
                {label(f.key)}
                {f.nullable ? ' (blank clears)' : ''}
                {f.type === 'array' ? ' (UUIDs, comma separated)' : ''}
                {f.format === 'date-time'
                  ? ' (ISO timestamp with timezone)'
                  : ''}
                {f.enum ? (
                  <select {...common}>
                    <option value="">Choose…</option>
                    {f.enum.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : f.maxLength && f.maxLength > 240 ? (
                  <textarea {...common} rows={5} />
                ) : (
                  <input
                    {...common}
                    type={
                      f.format === 'password'
                        ? 'password'
                        : f.format === 'email'
                          ? 'email'
                          : ['integer', 'number'].includes(f.type)
                            ? 'number'
                            : 'text'
                    }
                    min={f.minimum}
                    max={f.maximum}
                    step={f.type === 'integer' ? 1 : undefined}
                    autoComplete={
                      f.format === 'password' ? 'new-password' : 'off'
                    }
                  />
                )}
              </label>
            )
          })}
      </fieldset>
      <ErrorMessage text={error} />
      {uncertain ? (
        <div className="space-y-3 text-sm">
          <p>
            Write not confirmed. Read current server records before another
            change. A stale revision needs a fresh edit.
          </p>
          <Button type="button" variant="secondary" onClick={done}>
            Close and refresh records
          </Button>
        </div>
      ) : (
        <Button disabled={busy}>{busy ? 'Saving…' : title}</Button>
      )}
    </form>
  )
}
export function DataView({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted">Unavailable</span>
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>
  if (typeof value !== 'object')
    return (
      <span className="break-words whitespace-pre-wrap">{String(value)}</span>
    )
  if (Array.isArray(value))
    return value.length ? (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-3">
            <DataView value={item} />
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted">No records.</p>
    )
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {Object.entries(value).map(([key, v]) => (
        <div key={key} className="min-w-0">
          <dt className="mb-1 font-bold text-slate-600">{label(key)}</dt>
          <dd>
            <DataView value={v} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
export function ReadPanel({
  route,
  title,
  query = {},
}: {
  route: string
  title: string
  query?: Record<string, string | number | undefined>
}) {
  const r = useResource<unknown>(route, query)
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <h3 className="text-xl font-bold">{title}</h3>
      <Button variant="secondary" onClick={r.reload}>
        Refresh {title}
      </Button>
      {r.data !== null ? (
        <DataView value={r.data} />
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </section>
  )
}
export function PagedPanel({
  route,
  title,
  query = {},
}: {
  route: string
  title: string
  query?: Record<string, string | number | undefined>
}) {
  const [page, setPage] = useState(1)
  const r = useResource<{
    items: Row[]
    total: number
    page: number
    limit: number
    pages: number
  }>(route, { ...query, page, limit: 20 })
  return (
    <section className="space-y-4">
      <h3 className="text-xl font-bold">{title}</h3>
      <Button variant="secondary" onClick={r.reload}>
        Refresh {title}
      </Button>
      {r.data ? (
        <>
          <DataView value={r.data.items} />
          <Pagination data={r.data} change={setPage} />
        </>
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </section>
  )
}
