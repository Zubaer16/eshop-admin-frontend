'use client'
import { useState, type FormEvent, type ReactNode } from 'react'
import { api } from '@/lib/api/client'
import { ErrorMessage, message } from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
export const fieldClass =
  'mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal'
export function Field({
  name,
  label,
  value = '',
  type = 'text',
  required = false,
  min,
  max,
}: {
  name: string
  label: string
  value?: string | number
  type?: string
  required?: boolean
  min?: number
  max?: number
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value}
        min={min}
        max={max}
        step={type === 'number' ? 1 : undefined}
        className={fieldClass}
      />
    </label>
  )
}
export function Check({
  name,
  label,
  value = false,
}: {
  name: string
  label: string
  value?: boolean
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={value} />
      {label}
    </label>
  )
}
export const text = (data: FormData, name: string) =>
  String(data.get(name) || '').trim()
export function number(data: FormData, name: string, nullable = false) {
  const value = text(data, name)
  if (!value && nullable) return null
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 2147483647
  )
    throw new Error('Enter a bounded whole number for ' + name)
  return Number(value)
}
export function MutationForm({
  route,
  method,
  body,
  saved,
  children,
  label = 'Save configuration',
}: {
  route: string
  method: 'POST' | 'PUT'
  body: (data: FormData) => unknown
  saved: () => void
  children: ReactNode
  label?: string
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [uncertain, setUncertain] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || uncertain) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    let sent = false
    try {
      const payload = body(data)
      sent = true
      await api.request(route, { method, body: payload })
      saved()
    } catch (e) {
      setError(message(e))
      if (sent) setUncertain(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <fieldset
        disabled={busy || uncertain}
        className="grid gap-4 md:grid-cols-2"
      >
        {children}
      </fieldset>
      <ErrorMessage text={error} />
      {uncertain ? (
        <div className="space-y-3 text-sm">
          <p>
            The write was not confirmed. Refresh the list and inspect the server
            version before another write. Stale revisions require reloading the
            current record.
          </p>
          <Button type="button" variant="secondary" onClick={saved}>
            Close and refresh server records
          </Button>
        </div>
      ) : (
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : label}
        </Button>
      )}
    </form>
  )
}
