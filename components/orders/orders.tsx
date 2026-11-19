'use client'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import { Badge, statusKind } from '@/components/ui/badge'
import { displayDate } from '@/lib/presentation'
import { PageHeading } from '@/components/layout/page-heading'
import { money } from '@/lib/api/catalog'
import { useAuth } from '@/components/auth/auth-provider'
import {
  useResource,
  ResourceState,
  ErrorMessage,
  Pagination,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { Field, fieldClass, text } from '@/components/commerce/forms'
import {
  isOrderId,
  shippingPayload,
  refundPayload,
  inspected,
  type OrderPage,
} from '@/lib/api/orders'
import { useOrderResource } from './resource'

export function Orders() {
  const [page, setPage] = useState(1),
    [limit, setLimit] = useState(20),
    [draft, setDraft] = useState(''),
    [id, setId] = useState(''),
    [error, setError] = useState(''),
    [copiedId, setCopiedId] = useState('')
  const list = useResource<OrderPage>('/v1/admin/orders', { page, limit })

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('order')
    if (value && isOrderId(value)) {
      setDraft(value)
      setId(value)
    }
  }, [])

  function open(value: string) {
    if (!isOrderId(value)) {
      setError('Enter the exact order UUID.')
      return
    }
    setError('')
    setId(value)
    setDraft(value)
    window.history.replaceState(null, '', '/orders?order=' + value)
  }

  function closeOrder() {
    setId('')
    setDraft('')
    setError('')
    window.history.replaceState(null, '', '/orders')
  }

  async function copyOrderId(value: string) {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard access is unavailable.')
      await navigator.clipboard.writeText(value)
      setCopiedId(value)
      window.setTimeout(() => {
        setCopiedId((current) => (current === value ? '' : current))
      }, 1600)
    } catch {
      setError(
        'Could not copy the order UUID. You can select its full reference from the order details.',
      )
    }
  }

  if (id) {
    return (
      <section className="space-y-6">
        <PageHeading
          eyebrow="ORDER MANAGEMENT"
          title="Order details"
          description="Review the order snapshot and manage its permitted fulfillment, return and recovery actions."
          action={
            <Button variant="secondary" onClick={closeOrder}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to orders
            </Button>
          }
        />
        <OrderOperations key={id} id={id} />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="ORDER MANAGEMENT"
        title="Orders"
        description="Manage orders, payments and shipments from one place."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          open(draft.trim())
        }}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
      >
        <label className="min-w-0 text-sm font-bold">
          Exact order UUID
          <input
            className={fieldClass + ' mt-2'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste the complete order UUID"
            aria-label="Exact order UUID"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <span className="mt-1 block text-xs font-normal text-muted">
            Open a specific order using its canonical reference.
          </span>
        </label>
        <Button type="submit">Open order</Button>
        <Button
          type="button"
          variant="secondary"
          busy={list.isRefreshing}
          pendingLabel="Refreshing…"
          onClick={list.reload}
        >
          Refresh list
        </Button>
      </form>
      <ErrorMessage text={error} />

      {list.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-line bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">
                Total orders
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-ink">
                {list.data.total.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted">Across all result pages</p>
            </article>
            <article className="rounded-2xl border border-line bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">
                Current page
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-ink">
                {list.data.page}{' '}
                <span className="text-base font-semibold text-muted">
                  / {Math.max(1, list.data.pages)}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">Server-side pagination</p>
            </article>
            <article className="rounded-2xl border border-line bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">
                Results on this page
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-ink">
                {list.data.items.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                Maximum {list.data.limit} per page
              </p>
            </article>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-ink">
                All orders
              </h2>
              <p className="mt-1 text-sm text-muted">
                Payment and shipment states are shown independently.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted">
              Rows per page
              <select
                aria-label="Orders per page"
                className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div
            className="table-scroll hidden rounded-2xl border border-line bg-white shadow-sm md:block"
            tabIndex={0}
            role="region"
            aria-label="Orders table"
          >
            <table className="admin-table min-w-[850px]">
              <thead>
                <tr>
                  <th>Order reference</th>
                  <th>Placed</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Shipment</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold tracking-wide text-ink"
                          title={row.id}
                        >
                          #{row.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Copy full order UUID ${row.id}`}
                          title="Copy full order UUID"
                          onClick={() => void copyOrderId(row.id)}
                        >
                          {copiedId === row.id ? (
                            <Check size={15} aria-hidden="true" />
                          ) : (
                            <Copy size={15} aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                      <span className="block text-[11px] font-normal text-muted">
                        Order reference
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {displayDate(row.createdAt)}
                    </td>
                    <td className="whitespace-nowrap font-bold tabular-nums">
                      {money(row.totalMinor, row.currency)}
                    </td>
                    <td>
                      <Badge kind={statusKind(row.status)}>
                        {row.status.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      <Badge kind={statusKind(row.fulfillment?.status || '')}>
                        {row.fulfillment?.status || 'Not started'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => open(row.id)}
                      >
                        View details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.data.items.length && (
              <div className="p-10 text-center">
                <p className="font-bold text-ink">No orders found</p>
                <p className="mt-1 text-sm text-muted">
                  Orders will appear here when they are available.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 md:hidden" aria-label="Orders list">
            {list.data.items.map((row) => (
              <article
                key={row.id}
                data-testid="order-card"
                className="admin-offscreen-card space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">
                      Order reference
                    </p>
                    <p
                      className="mt-1 truncate font-extrabold text-ink"
                      title={row.id}
                    >
                      #{row.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    aria-label={`Copy full order UUID ${row.id}`}
                    title="Copy full order UUID"
                    onClick={() => void copyOrderId(row.id)}
                  >
                    {copiedId === row.id ? (
                      <Check size={15} aria-hidden="true" />
                    ) : (
                      <Copy size={15} aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 border-y border-line py-3">
                  <div>
                    <p className="text-xs text-muted">Placed</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {displayDate(row.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Amount</p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-ink">
                      {money(row.totalMinor, row.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Payment</p>
                    <div className="mt-1">
                      <Badge kind={statusKind(row.status)}>
                        {row.status.replaceAll('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Shipment</p>
                    <div className="mt-1">
                      <Badge kind={statusKind(row.fulfillment?.status || '')}>
                        {row.fulfillment?.status || 'Not started'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => open(row.id)}
                >
                  View details
                </Button>
              </article>
            ))}
            {!list.data.items.length && (
              <div className="rounded-2xl border border-line bg-white p-8 text-center">
                <p className="font-bold text-ink">No orders found</p>
                <p className="mt-1 text-sm text-muted">
                  Orders will appear here when they are available.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-white shadow-sm">
            <Pagination data={list.data} change={setPage} />
          </div>
        </>
      ) : (
        <ResourceState error={list.error} retry={list.reload} />
      )}
    </section>
  )
}
function ActionForm({
  title,
  disabled,
  submit,
  children,
}: {
  title: string
  disabled: boolean
  submit: (data: FormData) => Promise<void>
  children: ReactNode
}) {
  const [error, setError] = useState('')
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (disabled) return
    try {
      await submit(new FormData(event.currentTarget))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check fields.')
    }
  }
  return (
    <form
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      onSubmit={onSubmit}
    >
      <h4 className="font-bold">{title}</h4>
      <fieldset className="grid gap-3 md:grid-cols-2" disabled={disabled}>
        {children}
      </fieldset>
      <ErrorMessage text={error} />
      <Button type="submit" disabled={disabled}>
        {title}
      </Button>
    </form>
  )
}
function ShippingFields({ prefix }: { prefix: string }) {
  return (
    <>
      <Field name="carrier" label={prefix + ' carrier'} required />
      <Field
        name="trackingNumber"
        label={prefix + ' tracking number'}
        required
      />
    </>
  )
}
function OrderOperations({ id }: { id: string }) {
  const { session } = useAuth(),
    owner = session.user?.role === 'OWNER',
    resource = useOrderResource(id, true, owner)
  const data = resource.data,
    disabled =
      resource.busy || Boolean(resource.pending) || Boolean(resource.error)
  const action = (suffix: string, extra: Record<string, unknown> = {}) =>
    resource.act(resource.route + suffix, {
      requestId: crypto.randomUUID(),
      ...extra,
    })
  const confirmAction = (suffix: string, prompt: string) => {
    if (window.confirm(prompt)) void action(suffix)
  }
  return (
    <section className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[.16em] text-primary">
            ORDER REFERENCE
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">
            #{id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="mt-1 break-all text-xs text-muted">{id}</p>
        </div>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Badge kind={statusKind(data.order.status)}>
              {data.order.status.replaceAll('_', ' ')}
            </Badge>
            <Badge kind={statusKind(data.order.fulfillment?.status || '')}>
              {data.order.fulfillment?.status || 'Not started'}
            </Badge>
          </div>
        )}
      </div>
      <ErrorMessage text={resource.error} />
      <Button
        variant="secondary"
        disabled={resource.busy}
        onClick={() => void resource.refresh()}
      >
        Refresh selected order
      </Button>
      {resource.notice && (
        <p role="status" className="text-sm text-primary">
          {resource.notice}
        </p>
      )}
      {resource.pending && (
        <div className="space-y-3 rounded-xl bg-amber-50 p-4">
          <p className="text-sm">
            Unconfirmed action. The original UUID and payload are retained for
            an exact retry. Refresh and inspect the ledgers before discarding
            the local request.
          </p>
          <div className="flex gap-3">
            <Button
              disabled={resource.busy}
              onClick={() => void resource.retry()}
            >
              Retry same order action
            </Button>
            <Button
              variant="secondary"
              disabled={resource.busy}
              onClick={() => void resource.reconcile()}
            >
              Reconcile order action
            </Button>
          </div>
        </div>
      )}
      {data ? (
        <>
          <p role="status" className="font-bold">
            Order status: {data.order.status} · Shipment:{' '}
            {data.order.fulfillment?.status || 'Not started'}
          </p>
          <dl className="space-y-2 rounded-xl bg-slate-50 p-4">
            {[
              ['Merchandise', data.order.subtotalMinor],
              ['Discount', -data.order.discountMinor],
              ['Shipping', data.order.shippingMinor],
              ['Tax', data.order.taxMinor],
              ['Order total', data.order.totalMinor],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between">
                <dt>{label}</dt>
                <dd>{money(Number(value), data.order.currency)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm">
            Created {data.order.createdAt} · Paid{' '}
            {data.order.paidAt || 'Unconfirmed'} ·{' '}
            {data.order.deliveryKind || 'Flat delivery'} · Coupon{' '}
            {data.order.couponCode || 'None'}
          </p>
          <div className="admin-offscreen-card admin-offscreen-order-line rounded-xl border p-4 text-sm">
            <h3 className="font-bold">Delivery address snapshot</h3>
            <p>
              {data.order.shippingAddress.recipientName} ·{' '}
              {data.order.shippingAddress.phone}
            </p>
            <p>
              {[
                data.order.shippingAddress.addressLine1,
                data.order.shippingAddress.addressLine2,
                data.order.shippingAddress.city,
                data.order.shippingAddress.region,
                data.order.shippingAddress.postalCode,
                data.order.shippingAddress.countryCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
          {data.order.lines.map((line) => (
            <article key={line.id} className="rounded-xl border p-4 text-sm">
              <p className="font-bold">{line.title}</p>
              <p>
                {line.sku} · {line.quantity} units ·{' '}
                {money(line.unitPriceMinor, data.order.currency)} per unit · net{' '}
                {money(line.netLineTotalMinor, data.order.currency)}
              </p>
              <p className="break-all text-xs text-muted">
                Order line {line.id}
              </p>
            </article>
          ))}
          <h3 className="text-xl font-bold">Original shipment</h3>
          <p className="text-sm text-muted">
            One shipment for all order lines. No partial shipment or generic
            status override.
          </p>
          {data.order.status === 'PENDING_PAYMENT' && (
            <Button
              variant="danger"
              disabled={disabled}
              onClick={() => {
                if (
                  window.confirm(
                    'Cancel only this unpaid order and release its allocation?',
                  )
                )
                  void resource.act(resource.route + '/cancel')
              }}
            >
              Cancel unpaid order
            </Button>
          )}
          {data.order.status === 'PAID' && !data.order.fulfillment && (
            <Button
              disabled={disabled}
              onClick={() =>
                confirmAction(
                  '/fulfillment/start',
                  'Start processing all lines of this verified paid order?',
                )
              }
            >
              Start fulfillment
            </Button>
          )}
          {data.order.fulfillment?.status === 'PROCESSING' && (
            <ActionForm
              title="Ship original order"
              disabled={disabled}
              submit={async (form) => {
                if (
                  window.confirm(
                    'Record dispatch of the full original shipment?',
                  )
                )
                  await resource.act(
                    resource.route + '/fulfillment/ship',
                    shippingPayload(
                      crypto.randomUUID(),
                      text(form, 'carrier'),
                      text(form, 'trackingNumber'),
                    ),
                  )
              }}
            >
              <ShippingFields prefix="Original shipment" />
            </ActionForm>
          )}
          {data.order.fulfillment && (
            <p className="text-sm">
              {data.order.fulfillment.status} ·{' '}
              {data.order.fulfillment.carrier || 'Carrier pending'} ·{' '}
              {data.order.fulfillment.trackingNumber || 'Tracking pending'}
            </p>
          )}
          {data.order.fulfillment?.status === 'SHIPPED' && (
            <Button
              disabled={disabled}
              onClick={() =>
                confirmAction(
                  '/fulfillment/deliver',
                  'Confirm the original shipment was physically delivered?',
                )
              }
            >
              Mark original delivered
            </Button>
          )}
          <h3 className="text-xl font-bold">Customer returns and inspection</h3>
          <p className="text-sm text-muted">
            Only the customer initiates a return. Approval, physical receipt,
            inspection and stock return are separate actions. Refunds never
            imply restocking.
          </p>
          {data.returns.map((row) => (
            <article
              key={row.id}
              className="admin-offscreen-card space-y-3 rounded-xl border p-4"
            >
              <h4 className="break-all font-bold">Return {row.id}</h4>
              <p className="text-sm">
                {data.order.lines.find((line) => line.id === row.orderLineId)
                  ?.title || row.orderLineId}{' '}
                · {row.quantity} units · {row.reason} · {row.status}
              </p>
              {row.status === 'REQUESTED' && (
                <div className="flex gap-3">
                  <Button
                    disabled={disabled}
                    onClick={() =>
                      confirmAction(
                        '/returns/' + row.id + '/approve',
                        'Approve this customer return? No refund or stock change occurs.',
                      )
                    }
                  >
                    Approve return
                  </Button>
                  <Button
                    variant="danger"
                    disabled={disabled}
                    onClick={() =>
                      confirmAction(
                        '/returns/' + row.id + '/reject',
                        'Reject this pending return?',
                      )
                    }
                  >
                    Reject return
                  </Button>
                </div>
              )}
              {row.status === 'APPROVED' && (
                <ActionForm
                  title="Record physical inspection"
                  disabled={disabled}
                  submit={async (form) => {
                    const condition = text(form, 'condition')
                    if (!['RESTOCKABLE', 'DAMAGED'].includes(condition))
                      throw new Error('Choose the inspection outcome.')
                    if (
                      window.confirm(
                        'Record physical receipt and this inspection outcome? This does not restock or refund.',
                      )
                    )
                      await action('/returns/' + row.id + '/receive', {
                        condition,
                      })
                  }}
                >
                  <label className="text-sm font-bold">
                    Inspection condition
                    <select
                      aria-label="Inspection condition"
                      name="condition"
                      className={fieldClass}
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose actual inspection outcome
                      </option>
                      <option value="RESTOCKABLE">Restockable</option>
                      <option value="DAMAGED">Damaged</option>
                    </select>
                  </label>
                </ActionForm>
              )}
              {row.status === 'RECEIVED_RESTOCKABLE' && (
                <Button
                  disabled={disabled}
                  onClick={() =>
                    confirmAction(
                      '/returns/' + row.id + '/restock',
                      'Return inspected units to the original SKU inventory exactly once?',
                    )
                  }
                >
                  Restock original SKU
                </Button>
              )}
              {inspected(row.status) &&
                !data.replacements.some((r) => r.returnId === row.id) && (
                  <Button
                    variant="secondary"
                    disabled={disabled}
                    onClick={() =>
                      confirmAction(
                        '/replacements/returns/' + row.id + '/authorize',
                        'Authorize a nonfinancial same-SKU replacement? Stock is deducted only on dispatch; refund conflicts are checked by the server.',
                      )
                    }
                  >
                    Authorize same-SKU replacement
                  </Button>
                )}
            </article>
          ))}
          {!data.returns.length && (
            <p className="text-sm">No customer return requests.</p>
          )}
          <h3 className="text-xl font-bold">Same-SKU replacement dispatches</h3>
          {data.replacements.map((row) => (
            <article
              key={row.id}
              className="admin-offscreen-card space-y-3 rounded-xl border p-4"
            >
              <h4 className="break-all font-bold">Replacement {row.id}</h4>
              <p className="text-sm">
                Return {row.returnId} · {row.quantity} units · {row.skuSnapshot}{' '}
                · {row.status}
              </p>
              <p className="text-sm">
                {row.carrier || 'Carrier pending'} ·{' '}
                {row.trackingNumber || 'Tracking pending'}
              </p>
              {row.status === 'AUTHORIZED' && (
                <>
                  <ActionForm
                    title="Ship same-SKU replacement"
                    disabled={disabled}
                    submit={async (form) => {
                      if (
                        window.confirm(
                          'Dispatch this replacement and deduct available original-SKU stock?',
                        )
                      )
                        await resource.act(
                          resource.route + '/replacements/' + row.id + '/ship',
                          shippingPayload(
                            crypto.randomUUID(),
                            text(form, 'carrier'),
                            text(form, 'trackingNumber'),
                          ),
                        )
                    }}
                  >
                    <ShippingFields prefix="Replacement" />
                  </ActionForm>
                  <Button
                    variant="danger"
                    disabled={disabled}
                    onClick={() =>
                      confirmAction(
                        '/replacements/' + row.id + '/cancel',
                        'Cancel this replacement before dispatch?',
                      )
                    }
                  >
                    Cancel replacement authorization
                  </Button>
                </>
              )}
              {row.status === 'SHIPPED' && (
                <Button
                  disabled={disabled}
                  onClick={() =>
                    confirmAction(
                      '/replacements/' + row.id + '/deliver',
                      'Confirm replacement delivery?',
                    )
                  }
                >
                  Mark replacement delivered
                </Button>
              )}
            </article>
          ))}
          {!data.replacements.length && (
            <p className="text-sm">No replacement dispatches.</p>
          )}
          <h3 className="text-xl font-bold">Recovery timeline</h3>
          <ol className="space-y-2">
            {data.tracking.events.map((event) => (
              <li
                key={event.id}
                className="admin-offscreen-card rounded-xl border p-3 text-sm"
              >
                {event.type} · {event.status} · {event.occurredAt}
              </li>
            ))}
          </ol>
          {owner ? (
            <>
              <h3 className="text-xl font-bold">Refund requests</h3>
              <p className="text-sm text-muted">
                OWNER approval reserves a refund amount. A separate TEST
                worker/provider confirmation determines success. No inventory
                change occurs here. The server checks the remaining financial
                ceiling and replacement conflicts.
              </p>
              {data.refunds.map((row) => (
                <article
                  key={row.id}
                  className="admin-offscreen-card space-y-2 rounded-xl border p-4 text-sm"
                >
                  <p>
                    {row.id} · {money(row.amountMinor, row.currency)} ·{' '}
                    {row.reason} · {row.status}
                  </p>
                  <p>
                    {row.status === 'SUCCEEDED'
                      ? 'Refund confirmed by the server.'
                      : 'Refund not confirmed.'}{' '}
                    Provider submission:{' '}
                    {row.providerRefundSubmitted ? 'Recorded' : 'Not recorded'}.
                    Stock return: separate.
                  </p>
                </article>
              ))}
              {!data.refunds.length && (
                <p className="text-sm">No refund requests.</p>
              )}
              {data.order.status === 'PAID' && (
                <ActionForm
                  title="Approve refund request"
                  disabled={disabled}
                  submit={async (form) => {
                    const payload = refundPayload(
                      crypto.randomUUID(),
                      text(form, 'amountMinor'),
                      text(form, 'reason'),
                    )
                    if (
                      window.confirm(
                        'Approve a refund request for ' +
                          money(payload.amountMinor, data.order.currency) +
                          '? This reserves the amount; successful provider refund is a separate state.',
                      )
                    )
                      await resource.act(
                        '/v1/admin/payments/orders/' + id + '/refunds',
                        payload,
                      )
                  }}
                >
                  <Field
                    name="amountMinor"
                    label={
                      'Refund amount (' + data.order.currency + ' minor units)'
                    }
                    type="number"
                    min={1}
                    max={data.order.totalMinor}
                    required
                  />
                  <label className="text-sm font-bold">
                    Refund reason
                    <select name="reason" className={fieldClass}>
                      {[
                        'CUSTOMER_REQUEST',
                        'DUPLICATE',
                        'FRAUDULENT',
                        'OTHER',
                      ].map((reason) => (
                        <option key={reason}>{reason}</option>
                      ))}
                    </select>
                  </label>
                </ActionForm>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">
              Refund ledgers and approvals are OWNER-only.
            </p>
          )}
        </>
      ) : (
        !resource.error && <p role="status">Loading order and ledgers…</p>
      )}
    </section>
  )
}
