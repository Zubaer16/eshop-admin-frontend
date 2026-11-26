'use client'
import { PageHeading } from '@/components/layout/page-heading'
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
import { Panel, SectionHeading } from '@/components/ui/panel'
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
  AdminTabs,
} from '@/components/ui/admin-workspace'
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
export function Reports() {
  const { session } = useAuth()
  const allowed = reports.filter(
      (report) =>
        session.user?.role === 'OWNER' ||
        report[2].every((permission) =>
          session.user?.permissions.includes(permission),
        ),
    ),
    [selected, setSelected] = useState('')
  const entry = allowed.find((report) => report[0] === selected) || allowed[0]
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="BUSINESS INTELLIGENCE"
        title="Reports"
        description="Review bounded, permission-scoped reports returned by the server."
      />
      <AdminNotice title="Reporting boundaries">
        Verified TEST collections and confirmed refunds use independent event
        dates. Integer strings remain exact; minor units and currency groups are
        never converted or summed in the browser. Inventory is current, not
        historical cost or profit.
      </AdminNotice>
      {allowed.length ? (
        <Panel className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold text-ink">Report domain</p>
              <p className="mt-1 text-xs text-muted">
                Available reports follow your current grants.
              </p>
            </div>
            <AdminTabs
              label="Report domain"
              value={entry?.[0] || ''}
              onChange={setSelected}
              items={allowed.map((report) => ({
                value: report[0],
                label: report[1],
              }))}
            />
          </div>
        </Panel>
      ) : null}
      {entry ? (
        <Report key={entry[0]} kind={entry[0]} exportKind={entry[3]} />
      ) : (
        <AdminEmptyState
          title="No report domain is available"
          description="Your current grants do not include a report domain."
        />
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Export unavailable.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Report filters"
            subtitle={
              kind === 'inventory'
                ? 'Current inventory snapshot'
                : 'Currency and optional UTC event window'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                busy={r.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={r.reload}
              >
                Refresh report
              </Button>
            }
          />
        </div>
        <form
          className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
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
          <label className="min-w-0 text-xs font-bold text-muted">
            Currency{' '}
            {['daily', 'products', 'customers'].includes(kind)
              ? '(required)'
              : '(optional)'}
            <input
              className={fieldClass}
              maxLength={3}
              value={currency}
              required={['daily', 'products', 'customers'].includes(kind)}
              onChange={(event) =>
                setCurrency(event.target.value.toUpperCase())
              }
            />
          </label>
          {kind !== 'inventory' && (
            <>
              <label className="min-w-0 text-xs font-bold text-muted">
                From UTC day (inclusive)
                <input
                  className={fieldClass}
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label className="min-w-0 text-xs font-bold text-muted">
                To UTC day (exclusive)
                <input
                  className={fieldClass}
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
            </>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <Button type="submit">Apply filters</Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !r.data}
              busy={busy}
              pendingLabel="Preparing…"
              onClick={() => void download()}
            >
              Download bounded CSV
            </Button>
          </div>
        </form>
        <div className="px-4 pb-4 sm:px-5">
          <ErrorMessage text={error} />
        </div>
      </Panel>
      {r.data ? (
        <Panel className="overflow-hidden">
          <div className="border-b border-line bg-slate-50/70 px-4 py-4 sm:px-5">
            <SectionHeading
              title="Report results"
              subtitle="Values are presented from the current server response."
            />
          </div>
          <div className="p-4 sm:p-5">
            <DataView value={r.data} />
          </div>
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
        </Panel>
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </div>
  )
}
export { Dashboard } from './dashboard'
export function AuditActivity() {
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
      <PageHeading
        eyebrow="GOVERNANCE & SECURITY"
        title="Audit activity"
        description="Review server-recorded administrative events and the current audit query window."
      />
      <AdminNotice title="Authoritative activity source">
        This view displays server audit events only. It does not create a
        browser-local activity feed or infer actions that are not present in the
        server response.
      </AdminNotice>
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Audit filters"
            subtitle="Filter by the exact actor UUID when needed."
            action={
              <Button
                size="sm"
                variant="secondary"
                busy={r.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={r.reload}
              >
                Refresh activity
              </Button>
            }
          />
        </div>
        <form
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5"
          onSubmit={(event) => {
            event.preventDefault()
            setApplied(actor)
            setPage(1)
          }}
        >
          <label className="block min-w-0 flex-1 text-xs font-bold text-muted">
            Actor UUID (optional)
            <input
              className={fieldClass}
              maxLength={36}
              pattern="[a-fA-F0-9-]{36}"
              value={actor}
              placeholder="Paste the exact actor UUID"
              onChange={(event) => setActor(event.target.value)}
            />
          </label>
          <Button type="submit">Apply actor filter</Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!applied}
            onClick={() => {
              setActor('')
              setApplied('')
              setPage(1)
            }}
          >
            Clear filter
          </Button>
        </form>
      </Panel>
      {r.data ? (
        <div className="space-y-5">
          <AdminMetricCard
            label="Matching audit events"
            value={r.data.total.toLocaleString('en-US')}
            detail={`Page ${r.data.page} of ${Math.max(1, r.data.pages)} · 20 records per page`}
          />
          <Panel className="overflow-hidden">
            <div className="border-b border-line px-4 py-4 sm:px-5">
              <SectionHeading
                title="Audit query window"
                subtitle="Server-provided window metadata"
              />
            </div>
            <div className="p-4 sm:p-5">
              <DataView value={r.data.window} />
            </div>
          </Panel>
          <Panel className="overflow-hidden">
            <div className="border-b border-line px-4 py-4 sm:px-5">
              <SectionHeading
                title="Audit events"
                subtitle={`${r.data.items.length.toLocaleString('en-US')} events on this page`}
              />
            </div>
            <div className="p-4 sm:p-5">
              {r.data.items.length ? (
                <DataView value={r.data.items} />
              ) : (
                <AdminEmptyState
                  title="No audit events in this view"
                  description="Try clearing the actor filter or review the next available page."
                />
              )}
            </div>
            <Pagination data={r.data} change={setPage} />
          </Panel>
        </div>
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </section>
  )
}
