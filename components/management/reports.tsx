'use client'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import { useAuth } from '@/components/auth/auth-provider'
import {
  useResource,
  ResourceState,
  ErrorMessage,
  Pagination,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/components/commerce/forms'
import { DataView, type Row } from './shared'
const reports = [
  ['financial', 'Collections and refunds', ['payments.view'], 'sales'],
  ['daily', 'Daily collections', ['payments.view'], 'sales'],
  ['orders', 'Order report', ['orders.manage'], 'orders'],
  ['payments', 'Payment attempts', ['payments.view'], 'payments'],
  [
    'products',
    'Product performance',
    ['payments.view', 'catalog.manage'],
    'products',
  ],
  [
    'customers',
    'Customer performance',
    ['payments.view', 'customers.view'],
    'customers',
  ],
  ['inventory', 'Current inventory', ['inventory.adjust'], 'inventory'],
] as const
export function LiveReports() {
  const { session } = useAuth()
  const allowed = reports.filter(
      (r) =>
        session.user?.role === 'OWNER' ||
        r[2].every((p) => session.user?.permissions.includes(p)),
    ),
    [selected, setSelected] = useState('')
  const entry = allowed.find((r) => r[0] === selected) || allowed[0]
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Reports</h1>
      <p className="text-sm text-muted">
        Verified TEST collections and confirmed refunds use independent event
        dates. Integer strings remain exact; minor units and currency groups are
        never converted or summed in the browser. Inventory is current, not
        historical cost/profit.
      </p>
      <div className="flex flex-wrap gap-3">
        {allowed.map((r) => (
          <Button
            key={r[0]}
            variant={entry?.[0] === r[0] ? 'primary' : 'secondary'}
            onClick={() => setSelected(r[0])}
          >
            {r[1]}
          </Button>
        ))}
      </div>
      {entry ? (
        <Report key={entry[0]} kind={entry[0]} exportKind={entry[3]} />
      ) : (
        <p role="status">
          No report domain is available with your current grants.
        </p>
      )}
    </section>
  )
}
function Report({ kind, exportKind }: { kind: string; exportKind: string }) {
  const [currency, setCurrency] = useState('USD'),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [page, setPage] = useState(1),
    [query, setQuery] = useState<Record<string, string | number | undefined>>({
      currency: ['daily', 'products', 'customers'].includes(kind)
        ? 'USD'
        : undefined,
    }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const paged = [
      'orders',
      'payments',
      'products',
      'customers',
      'inventory',
    ].includes(kind),
    r = useResource<Row>('/v1/admin/reports/' + kind, {
      ...query,
      ...(paged ? { page, limit: 20 } : {}),
    })
  async function download() {
    setBusy(true)
    setError('')
    try {
      const csv = await api.request<string>(
        '/v1/admin/reports/export/' + exportKind,
        {
          query,
          responseType: 'text',
        },
      )
      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      )
      const a = document.createElement('a')
      a.href = url
      a.download = 'eshop-' + exportKind + '.csv'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export unavailable.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (Boolean(from) !== Boolean(to)) {
            setError('Supply both UTC dates.')
            return
          }
          if (currency && !/^[A-Z]{3}$/.test(currency)) {
            setError('Enter an ISO currency.')
            return
          }
          setError('')
          setPage(1)
          setQuery({
            currency: currency || undefined,
            ...(kind === 'inventory'
              ? {}
              : { from: from || undefined, to: to || undefined }),
          })
        }}
      >
        <label className="text-sm font-bold">
          Currency
          {['daily', 'products', 'customers'].includes(kind)
            ? ' (required)'
            : ' (optional)'}
          <input
            className={fieldClass}
            maxLength={3}
            value={currency}
            required={['daily', 'products', 'customers'].includes(kind)}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </label>
        {kind !== 'inventory' && (
          <>
            <label className="text-sm font-bold">
              From UTC day (inclusive)
              <input
                className={fieldClass}
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-sm font-bold">
              To UTC day (exclusive)
              <input
                className={fieldClass}
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </>
        )}
        <Button>Apply report filters</Button>
        <Button type="button" variant="secondary" onClick={r.reload}>
          Refresh report
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !r.data}
          onClick={() => void download()}
        >
          Download bounded CSV
        </Button>
      </form>
      <ErrorMessage text={error} />
      {r.data ? (
        <>
          <DataView value={r.data} />
          {paged && (
            <Pagination
              data={
                r.data as unknown as {
                  items: unknown[]
                  total: number
                  page: number
                  limit: number
                  pages: number
                }
              }
              change={setPage}
            />
          )}
        </>
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </div>
  )
}
export function LiveDashboard() {
  const r = useResource<Row>('/v1/admin/dashboard/overview')
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Dashboard</h1>
      <p className="text-sm text-muted">
        Current permission-aware server projection. Unavailable domains are not
        reported as zero. Collections are TEST scope; availability flags
        determine which sections are authorized.
      </p>
      <Button variant="secondary" onClick={r.reload}>
        Refresh dashboard
      </Button>
      {r.data ? (
        <DataView value={r.data} />
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </section>
  )
}
export function LiveActivity() {
  const [page, setPage] = useState(1),
    [actor, setActor] = useState(''),
    [applied, setApplied] = useState(''),
    r = useResource<{
      items: Row[]
      total: number
      page: number
      limit: number
      pages: number
      window: Row
    }>('/v1/admin/activity', { page, limit: 20, actorId: applied || undefined })
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Audit activity</h1>
      <p className="text-sm text-muted">
        Server audit events. No browser-local activity feed.
      </p>
      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setApplied(actor)
          setPage(1)
        }}
      >
        <label className="text-sm font-bold">
          Actor UUID (optional)
          <input
            className={fieldClass}
            maxLength={36}
            pattern="[a-fA-F0-9-]{36}"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </label>
        <Button>Filter audit events</Button>
      </form>
      {r.data ? (
        <>
          <DataView value={r.data.window} />
          <DataView value={r.data.items} />
          <Pagination data={r.data} change={setPage} />
        </>
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </section>
  )
}
