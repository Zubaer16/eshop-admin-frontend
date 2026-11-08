'use client'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
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

export function LiveOrders() {
  const [page, setPage] = useState(1),
    [draft, setDraft] = useState(''),
    [id, setId] = useState(''),
    [error, setError] = useState('')
  const list = useResource<OrderPage>('/v1/admin/orders', { page, limit: 20 })
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
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Orders</h1>
      <p className="text-sm text-muted">
        Newest first, server pagination. Lookup uses an exact UUID; global
        text/status filters are unavailable in this version. Payment and
        shipment states are independent.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          open(draft.trim())
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="grow text-sm font-bold">
          Exact order UUID
          <input
            className={fieldClass}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            required
          />
        </label>
        <Button>Open order</Button>
        <Button type="button" variant="secondary" onClick={list.reload}>
          Refresh order list
        </Button>
      </form>
      <ErrorMessage text={error} />
      {id && <OrderOperations key={id} id={id} />}
      {list.data ? (
        <>
          <div className="space-y-3">
            {list.data.items.map((row) => (
              <article
                key={row.id}
                className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="break-all font-bold">{row.id}</p>
                <p className="text-sm">
                  Order: {row.status} · Shipment:{' '}
                  {row.fulfillment?.status || 'Not started'} ·{' '}
                  {money(row.totalMinor, row.currency)}
                </p>
                <p className="text-xs text-muted">Created {row.createdAt}</p>
                <Button variant="secondary" onClick={() => open(row.id)}>
                  View order {row.id}
                </Button>
              </article>
            ))}
            {!list.data.items.length && <p>No orders.</p>}
          </div>
          <Pagination data={list.data} change={setPage} />
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
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="break-all text-2xl font-black">Order {id}</h2>
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
          <div className="rounded-xl border p-4 text-sm">
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
            <article key={row.id} className="space-y-3 rounded-xl border p-4">
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
            <article key={row.id} className="space-y-3 rounded-xl border p-4">
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
              <li key={event.id} className="rounded-xl border p-3 text-sm">
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
                  className="space-y-2 rounded-xl border p-4 text-sm"
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
