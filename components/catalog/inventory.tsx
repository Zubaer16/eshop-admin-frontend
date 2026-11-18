'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  Boxes,
  LockKeyhole,
  Package,
  Search,
} from 'lucide-react'
import { api } from '@/lib/api/client'
import {
  isUuid,
  type Balance,
  type Movement,
  type Page,
} from '@/lib/api/catalog'
import { Button } from '@/components/ui/button'
import { Field, controlClass } from '@/components/ui/field'
import { Panel } from '@/components/ui/panel'
import { prefetchAdminInventoryBalance } from '@/lib/admin-cache'
import { createIntentPrefetch } from '@/lib/intent-prefetch'
import {
  filterInventoryPage,
  inventoryStatus,
  summarizeInventoryPage,
} from '@/lib/inventory-presentation'
import { Modal } from '@/components/ui/modal'
import { PageHeading } from '@/components/layout/page-heading'
import {
  ErrorMessage,
  Pagination,
  ResourceState,
  message,
  useResource,
} from './shared'
type Adjustment = {
  requestId: string
  delta: number
  reason: string
  note: string
}
export function Inventory() {
  const params = useSearchParams(),
    initialProduct = params.get('productId') || ''
  const balancePrefetchIntent = useMemo(() => createIntentPrefetch(300), [])
  useEffect(
    () => () => balancePrefetchIntent.cancelAll(),
    [balancePrefetchIntent],
  )
  const [page, setPage] = useState(1),
    [low, setLow] = useState(''),
    [search, setSearch] = useState(''),
    [productId, setProductId] = useState(
      isUuid(initialProduct) ? initialProduct : '',
    ),
    [filter, setFilter] = useState(productId),
    [selected, setSelected] = useState('')
  const [pendingAdjustment, setPendingAdjustment] = useState(false)
  const resource = useResource<Page<Balance>>('/v1/admin/inventory', {
    page,
    limit: 20,
    productId: filter || undefined,
    lowStock: low || undefined,
  })
  const pageItems = resource.data?.items ?? []
  const summary = useMemo(() => summarizeInventoryPage(pageItems), [pageItems])
  const visibleItems = useMemo(
    () => filterInventoryPage(pageItems, search),
    [pageItems, search],
  )
  return (
    <>
      <PageHeading
        eyebrow="STOCK CONTROL"
        title="Inventory"
        description="Physical, reserved and available quantities are separate. Checkout remains authoritative."
      />
      {resource.data && (
        <section
          aria-label="Current inventory page summary"
          className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: 'SKUs on this page',
              value: summary.skuCount,
              icon: Package,
              tone: 'text-primary bg-blue-50',
            },
            {
              label: 'Physical units · page',
              value: summary.physicalUnits,
              icon: Boxes,
              tone: 'text-slate-700 bg-slate-100',
            },
            {
              label: 'Reserved units · page',
              value: summary.reservedUnits,
              icon: LockKeyhole,
              tone: 'text-violet-700 bg-violet-50',
            },
            {
              label: 'Low stock · page',
              value: summary.lowStockCount,
              icon: AlertTriangle,
              tone: summary.lowStockCount
                ? 'text-amber-700 bg-amber-50'
                : 'text-emerald-700 bg-emerald-50',
            },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="rounded-2xl border border-line bg-white p-4 shadow-[0_3px_18px_rgba(15,23,42,.025)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-muted">
                    {metric.label}
                  </p>
                  <span
                    className={
                      'grid h-9 w-9 place-items-center rounded-xl ' +
                      metric.tone
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-ink">
                  {metric.value.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Based on the currently loaded page
                </p>
              </div>
            )
          })}
        </section>
      )}
      <Panel>
        <div className="space-y-3 border-b border-line p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(190px,260px)_auto_auto]">
            <label className="relative block">
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                aria-label="Search current inventory page by SKU or product"
                placeholder="Search this page by SKU or product"
                className={controlClass + ' pl-10'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <input
              aria-label="Filter by exact product UUID"
              placeholder="Exact product UUID (optional)"
              className={controlClass}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
            <select
              aria-label="Low stock filter"
              className={controlClass + ' lg:w-auto'}
              value={low}
              onChange={(e) => {
                setLow(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All balances</option>
              <option value="true">Low physical stock</option>
              <option value="false">Above threshold</option>
            </select>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFilter(productId.trim())
                  setPage(1)
                }}
              >
                Filter
              </Button>
              <Button
                variant="ghost"
                type="button"
                busy={resource.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={resource.reload}
              >
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              Showing {visibleItems.length} of {pageItems.length} loaded items ·{' '}
              {resource.data?.total ?? 0} total SKUs
            </span>
            {search.trim() && (
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setSearch('')}
              >
                Clear page search
              </button>
            )}
          </div>
        </div>
        {!resource.data ? (
          <ResourceState error={resource.error} retry={resource.reload} />
        ) : (
          <>
            <div
              className="table-scroll"
              data-table-scroll
              tabIndex={0}
              aria-label="Inventory balances table"
            >
              <table className="admin-table min-w-[900px]">
                <thead className="bg-slate-50 text-xs text-muted">
                  <tr>
                    {[
                      'SKU / product',
                      'Physical',
                      'Reserved',
                      'Available',
                      'Threshold',
                      'Stock status',
                      'Actions',
                    ].map((x) => (
                      <th className="p-4" key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleItems.map((balance) => {
                    const status = inventoryStatus(balance)
                    const statusLabel =
                      status === 'NO_AVAILABLE_STOCK'
                        ? 'No available stock'
                        : status === 'LOW_STOCK'
                          ? 'Low stock'
                          : 'Healthy'
                    const statusClass =
                      status === 'NO_AVAILABLE_STOCK'
                        ? 'bg-red-50 text-red-700'
                        : status === 'LOW_STOCK'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                    return (
                      <tr key={balance.id}>
                        <td className="p-4">
                          <p className="font-bold text-ink">{balance.sku}</p>
                          <p className="mt-0.5 text-xs font-normal text-muted">
                            {balance.title}
                          </p>
                        </td>
                        <td className="p-4 tabular-nums">
                          {balance.onHand.toLocaleString()}
                        </td>
                        <td className="p-4 tabular-nums">
                          {balance.reservedQuantity.toLocaleString()}
                        </td>
                        <td className="p-4 tabular-nums font-semibold">
                          {balance.availableQuantity.toLocaleString()}
                        </td>
                        <td className="p-4 tabular-nums">
                          {balance.lowStockThreshold.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={
                              'inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ' +
                              statusClass
                            }
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="secondary"
                            onMouseEnter={() =>
                              balancePrefetchIntent.schedule(balance.id, () =>
                                prefetchAdminInventoryBalance(balance.id),
                              )
                            }
                            onMouseLeave={() =>
                              balancePrefetchIntent.cancel(balance.id)
                            }
                            onFocus={() =>
                              balancePrefetchIntent.run(balance.id, () =>
                                prefetchAdminInventoryBalance(balance.id),
                              )
                            }
                            onTouchStart={() =>
                              balancePrefetchIntent.run(balance.id, () =>
                                prefetchAdminInventoryBalance(balance.id),
                              )
                            }
                            onClick={() => setSelected(balance.id)}
                          >
                            Balance details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!visibleItems.length && (
                <p className="p-8 text-center text-sm text-muted">
                  {pageItems.length
                    ? 'No inventory items on this page match your search.'
                    : 'No inventory balances match.'}
                </p>
              )}
            </div>
            <Pagination data={resource.data} change={setPage} />
          </>
        )}
      </Panel>
      <Modal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open && !pendingAdjustment) {
            setSelected('')
            resource.reload()
          }
        }}
        title="SKU inventory balance"
        wide
      >
        {selected && (
          <BalanceDetail
            key={selected}
            id={selected}
            onPending={setPendingAdjustment}
          />
        )}
      </Modal>
    </>
  )
}
function BalanceDetail({
  id,
  onPending,
}: {
  id: string
  onPending: (pending: boolean) => void
}) {
  const balance = useResource<Balance>('/v1/admin/inventory/' + id),
    [page, setPage] = useState(1),
    movements = useResource<Page<Movement>>(
      '/v1/admin/inventory/' + id + '/movements',
      {
        page,
        limit: 10,
      },
    )
  const [delta, setDelta] = useState(''),
    [reason, setReason] = useState('RECEIPT'),
    [note, setNote] = useState(''),
    [threshold, setThreshold] = useState(''),
    [pending, setPending] = useState<Adjustment | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const canWrite = api.can('inventory.adjust')
  useEffect(() => {
    onPending(Boolean(pending))
    if (!pending) return
    const leaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', leaving)
    return () => window.removeEventListener('beforeunload', leaving)
  }, [pending, onPending])
  function refresh() {
    balance.reload()
    movements.reload()
  }
  async function adjust(event: FormEvent) {
    event.preventDefault()
    setError('')
    const change = pending || {
      requestId: crypto.randomUUID(),
      delta: Number(delta),
      reason,
      note: note.trim(),
    }
    if (
      !Number.isSafeInteger(change.delta) ||
      change.delta === 0 ||
      Math.abs(change.delta) > 2147483647 ||
      !delta.trim()
    ) {
      setError('Enter a nonzero whole-unit adjustment.')
      return
    }
    if (
      (['RECEIPT', 'RETURN'].includes(change.reason) && change.delta < 0) ||
      (change.reason === 'DAMAGE' && change.delta > 0)
    ) {
      setError('Receipts/returns increase stock; damage decreases stock.')
      return
    }
    setPending(change)
    setBusy(true)
    try {
      const result = await api.request<{ replayed: boolean }>(
        '/v1/admin/inventory/' + id + '/adjustments',
        { method: 'POST', body: change },
      )
      setPending(null)
      setDelta('')
      setNote('')
      setNotice(
        result.replayed
          ? 'Existing adjustment confirmed; no duplicate stock change.'
          : 'Stock adjustment confirmed.',
      )
      refresh()
    } catch (error) {
      setError(
        message(error) +
          ' Review movements, then retry the unchanged request if its result is uncertain.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function updateThreshold(event: FormEvent) {
    event.preventDefault()
    if (
      !threshold.trim() ||
      !Number.isInteger(Number(threshold)) ||
      Number(threshold) < 0
    )
      return
    setBusy(true)
    setError('')
    try {
      await api.request('/v1/admin/inventory/' + id + '/threshold', {
        method: 'PATCH',
        body: { lowStockThreshold: Number(threshold) },
      })
      setNotice('Low-stock threshold saved.')
      balance.reload()
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      {!balance.data ? (
        <ResourceState error={balance.error} retry={balance.reload} />
      ) : (
        <div className="rounded-xl bg-slate-50 p-4">
          <h2 className="font-bold">
            {balance.data.sku} · {balance.data.title}
          </h2>
          <p className="mt-2 text-sm">
            Physical {balance.data.onHand} · Reserved{' '}
            {balance.data.reservedQuantity} · Available{' '}
            {balance.data.availableQuantity}
          </p>
          <p className="mt-2 break-all text-xs text-muted">
            Balance UUID: {id}
          </p>
        </div>
      )}
      <ErrorMessage text={error} />
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}
        </p>
      )}
      {canWrite && (
        <>
          <form
            onSubmit={adjust}
            className="space-y-3 rounded-xl border border-line p-4"
          >
            <h3 className="font-bold">Adjust physical stock</h3>
            <fieldset
              disabled={busy || Boolean(pending)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <Field label="Signed units">
                <input
                  required
                  type="number"
                  min={-2147483647}
                  max={2147483647}
                  step={1}
                  className={controlClass}
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                />
              </Field>
              <Field label="Adjustment reason">
                <select
                  className={controlClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {['RECEIPT', 'RETURN', 'DAMAGE', 'CORRECTION'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Adjustment note">
                <input
                  className={controlClass}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
            </fieldset>
            {pending && (
              <p className="break-all text-xs text-amber-800">
                Unconfirmed request: {pending.requestId}. The payload is locked
                for a safe explicit retry. Reconcile or discard the local
                request before closing this dialog.
              </p>
            )}
            <Button
              busy={busy}
              pendingLabel={
                pending ? 'Retrying adjustment…' : 'Applying adjustment…'
              }
              disabled={!balance.data}
              type="submit"
            >
              {pending ? 'Retry same adjustment' : 'Apply adjustment'}
            </Button>
            <Button
              disabled={busy}
              type="button"
              variant="secondary"
              onClick={refresh}
            >
              Refresh balance and movements
            </Button>
            {pending && (
              <Button
                disabled={busy}
                type="button"
                variant="ghost"
                onClick={() => {
                  if (
                    window.confirm(
                      'Only start a new adjustment after reconciling the previous request against movement history. Discard this local request?',
                    )
                  ) {
                    setPending(null)
                    setDelta('')
                    setNotice(
                      'Local draft cleared. Review current stock before a new adjustment.',
                    )
                  }
                }}
              >
                Discard local request
              </Button>
            )}
          </form>
          <form
            onSubmit={updateThreshold}
            className="flex flex-wrap items-end gap-3"
          >
            <Field
              label={`Low-stock threshold (current ${balance.data?.lowStockThreshold ?? '…'})`}
            >
              <input
                required
                type="number"
                min={0}
                max={2147483647}
                className={controlClass}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </Field>
            <Button
              busy={busy}
              pendingLabel="Saving threshold…"
              disabled={!balance.data}
              type="submit"
            >
              Save threshold
            </Button>
          </form>
        </>
      )}
      <Panel>
        <div className="flex items-center justify-between p-4">
          <h3 className="font-bold">Append-only movement history</h3>
          <Button
            variant="ghost"
            busy={movements.isRefreshing}
            pendingLabel="Refreshing…"
            onClick={movements.reload}
          >
            Refresh movements
          </Button>
        </div>
        {!movements.data ? (
          <ResourceState error={movements.error} retry={movements.reload} />
        ) : (
          <>
            {movements.data.items.map((m) => (
              <div key={m.id} className="border-t border-line p-4 text-sm">
                <p>
                  {m.reason} · {m.before} → {m.after} ({m.delta > 0 ? '+' : ''}
                  {m.delta})
                </p>
                <p className="mt-1 text-xs text-muted">
                  {m.createdAt} · Request {m.requestId}
                </p>
                <p className="mt-1">{m.note}</p>
              </div>
            ))}
            {!movements.data.items.length && (
              <p className="p-5 text-sm text-muted">No movements yet.</p>
            )}
            <Pagination data={movements.data} change={setPage} />
          </>
        )}
      </Panel>
    </div>
  )
}
