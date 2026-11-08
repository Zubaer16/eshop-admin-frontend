'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
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
import { Modal } from '@/components/ui/modal'
import { PageHeading } from '@/components/admin/page-heading'
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
export function LiveInventory() {
  const params = useSearchParams(),
    initialProduct = params.get('productId') || ''
  const [page, setPage] = useState(1),
    [low, setLow] = useState(''),
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
  return (
    <>
      <PageHeading
        eyebrow="STOCK CONTROL"
        title="Inventory"
        description="Physical, reserved and available quantities are separate. Checkout remains authoritative."
      />
      <Panel>
        <form
          className="flex flex-wrap gap-3 border-b border-line p-4"
          onSubmit={(e) => {
            e.preventDefault()
            setFilter(productId.trim())
            setPage(1)
          }}
        >
          <input
            aria-label="Filter product UUID"
            placeholder="Exact product UUID"
            className={controlClass + ' max-w-xs'}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Filter inventory
          </Button>
          <select
            aria-label="Low stock filter"
            className={controlClass + ' w-auto'}
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
          <Button variant="ghost" type="button" onClick={resource.reload}>
            Refresh
          </Button>
        </form>
        {!resource.data ? (
          <ResourceState error={resource.error} retry={resource.reload} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-muted">
                  <tr>
                    {[
                      'SKU / product',
                      'Physical',
                      'Reserved',
                      'Available',
                      'Threshold',
                      'Actions',
                    ].map((x) => (
                      <th className="p-4" key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {resource.data.items.map((balance) => (
                    <tr key={balance.id}>
                      <td className="p-4">
                        <p className="font-bold">{balance.sku}</p>
                        <p className="text-xs text-muted">{balance.title}</p>
                      </td>
                      <td className="p-4">{balance.onHand}</td>
                      <td className="p-4">{balance.reservedQuantity}</td>
                      <td className="p-4">{balance.availableQuantity}</td>
                      <td className="p-4">
                        {balance.lowStockThreshold}
                        {balance.lowStock ? ' · Low' : ''}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="secondary"
                          onClick={() => setSelected(balance.id)}
                        >
                          Balance details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!resource.data.items.length && (
                <p className="p-8 text-sm text-muted">
                  No inventory balances match.
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
            <Button disabled={busy || !balance.data} type="submit">
              {busy
                ? 'Saving…'
                : pending
                  ? 'Retry same adjustment'
                  : 'Apply adjustment'}
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
            <Button disabled={busy || !balance.data} type="submit">
              Save threshold
            </Button>
          </form>
        </>
      )}
      <Panel>
        <div className="flex items-center justify-between p-4">
          <h3 className="font-bold">Append-only movement history</h3>
          <Button variant="ghost" onClick={movements.reload}>
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
