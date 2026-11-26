'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { Button } from '@/components/ui/button'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, SectionHeading } from '@/components/ui/panel'
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
} from '@/components/ui/admin-workspace'
import { useState } from 'react'
import {
  useResource,
  ResourceState,
  Pagination,
} from '@/components/catalog/shared'
import { money, type Page } from '@/lib/api/catalog'
import { displayDateTime } from '@/lib/presentation'
import { fieldClass } from './forms'
type Row = {
  id: string
  orderId: string
  attemptStatus: string
  collectionState: string
  currency: string
  attemptedMinor: number
  settledMinor: number | null
  lifetimeRefundedMinor: string
  createdAt: string
  settledAt: string | null
}
type Report = Page<Row> & {
  window: {
    from: string
    to: string
    asOf: string
    timeZone: string
    paymentScope: string
  }
}
export function Payments() {
  const [page, setPage] = useState(1),
    [currency, setCurrency] = useState(''),
    [status, setStatus] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState('')
  const completeWindow = Boolean(from && to),
    data = useResource<Report>('/v1/admin/reports/payments', {
      page,
      limit: 20,
      currency: /^[A-Z]{3}$/.test(currency) ? currency : undefined,
      status: status || undefined,
      from: completeWindow ? from : undefined,
      to: completeWindow ? to : undefined,
    })
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="PAYMENTS & RECONCILIATION"
        title="TEST payment records"
        description="Inspect server-reported payment attempts, collection states and confirmed refund history."
      />
      <AdminNotice title="TEST-scope interpretation" tone="warning">
        Preparation and confirmed settlement are separate. These records do not
        prove live payments. Refunds shown are lifetime confirmed amounts; no
        browser-calculated financial totals are presented.
      </AdminNotice>
      <Panel className="p-4 sm:p-5">
        <SectionHeading
          title="Payment record filters"
          subtitle="Dates are UTC days; the end date is exclusive."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="min-w-0 text-xs font-bold text-muted">
            Currency (optional)
            <input
              className={fieldClass}
              value={currency}
              maxLength={3}
              placeholder="e.g. USD"
              onChange={(e) => {
                setCurrency(e.target.value.toUpperCase())
                setPage(1)
              }}
            />
          </label>
          <label className="min-w-0 text-xs font-bold text-muted">
            Attempt status
            <select
              className={fieldClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              {[
                'CREATING',
                'READY',
                'REQUIRES_REVIEW',
                'SETTLED',
                'CANCELLING',
                'CANCELLED',
                'CONFIRMING',
                'CAPTURING',
                'AWAITING_WEBHOOK',
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0 text-xs font-bold text-muted">
            From UTC day (inclusive)
            <input
              type="date"
              className={fieldClass}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
            />
          </label>
          <label className="min-w-0 text-xs font-bold text-muted">
            To UTC day (exclusive)
            <input
              type="date"
              className={fieldClass}
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted">
            {Boolean(from) !== Boolean(to)
              ? 'Select both UTC dates to apply the date filter. The server default window remains active.'
              : 'Only complete date ranges are sent to the server.'}
          </p>
          <Button
            variant="secondary"
            busy={data.isRefreshing}
            pendingLabel="Refreshing…"
            onClick={data.reload}
          >
            Refresh payment records
          </Button>
        </div>
      </Panel>
      {data.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminMetricCard
              label="Matching attempts"
              value={data.data.total.toLocaleString('en-US')}
              detail="Server-reported total for the selected filters"
            />
            <AdminMetricCard
              label="Current page"
              value={data.data.items.length.toLocaleString('en-US')}
              detail={`Page ${data.data.page} of ${Math.max(1, data.data.pages)}`}
            />
            <AdminMetricCard
              label="Payment scope"
              value={data.data.window.paymentScope || 'Server scope'}
              detail={`${data.data.window.timeZone} · As of ${displayDateTime(data.data.window.asOf)}`}
            />
          </div>
          <Panel className="overflow-hidden">
            <div className="border-b border-line bg-slate-50/70 px-4 py-3 sm:px-5">
              <SectionHeading
                title="Server reporting window"
                subtitle={`${data.data.window.from} → ${data.data.window.to} · ${data.data.window.timeZone}`}
              />
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs leading-relaxed text-muted">
                Window timestamp: {displayDateTime(data.data.window.asOf)}.
                Attempted and settled values are shown per record and currency;
                lifetime refunded values remain exact minor-unit strings.
              </p>
            </div>
            <div
              className="table-scroll hidden md:block"
              tabIndex={0}
              role="region"
              aria-label="Payment attempts"
            >
              <table className="admin-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>Payment / order</th>
                    <th>Attempt</th>
                    <th>Collection</th>
                    <th>Attempted</th>
                    <th>Settled</th>
                    <th>Lifetime refunded</th>
                    <th>Created / settled</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.items.map((row) => (
                    <tr key={row.id}>
                      <td className="max-w-56">
                        <p className="font-bold text-ink">{row.id}</p>
                        <p className="mt-1 break-all text-[11px] font-normal text-muted">
                          Order {row.orderId}
                        </p>
                      </td>
                      <td>
                        <Badge kind={statusKind(row.attemptStatus)}>
                          {row.attemptStatus}
                        </Badge>
                      </td>
                      <td>
                        <Badge kind={statusKind(row.collectionState)}>
                          {row.collectionState}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap font-semibold tabular-nums">
                        {money(row.attemptedMinor, row.currency)}
                      </td>
                      <td className="whitespace-nowrap font-semibold tabular-nums">
                        {row.settledMinor === null
                          ? 'Unconfirmed'
                          : money(row.settledMinor, row.currency)}
                      </td>
                      <td className="whitespace-nowrap text-xs font-semibold tabular-nums">
                        {row.lifetimeRefundedMinor} {row.currency} minor
                      </td>
                      <td className="min-w-48 text-xs text-muted">
                        <p>{displayDateTime(row.createdAt)}</p>
                        <p className="mt-1">
                          {row.settledAt
                            ? displayDateTime(row.settledAt)
                            : 'Not confirmed'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {data.data.items.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-line bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all text-xs font-extrabold text-ink">
                        {row.id}
                      </p>
                      <p className="mt-1 break-all text-[11px] text-muted">
                        Order {row.orderId}
                      </p>
                    </div>
                    <Badge kind={statusKind(row.attemptStatus)}>
                      {row.attemptStatus}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge kind={statusKind(row.collectionState)}>
                      {row.collectionState}
                    </Badge>
                    <Badge>{row.currency}</Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-muted">Attempted</dt>
                      <dd className="mt-1 font-bold tabular-nums text-ink">
                        {money(row.attemptedMinor, row.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Settled</dt>
                      <dd className="mt-1 font-bold tabular-nums text-ink">
                        {row.settledMinor === null
                          ? 'Unconfirmed'
                          : money(row.settledMinor, row.currency)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted">
                        Lifetime refunded (exact minor units)
                      </dt>
                      <dd className="mt-1 font-bold tabular-nums text-ink">
                        {row.lifetimeRefundedMinor} {row.currency}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Created</dt>
                      <dd className="mt-1 font-semibold text-ink">
                        {displayDateTime(row.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Settled</dt>
                      <dd className="mt-1 font-semibold text-ink">
                        {row.settledAt
                          ? displayDateTime(row.settledAt)
                          : 'Not confirmed'}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            {!data.data.items.length && (
              <div className="p-4 sm:p-5">
                <AdminEmptyState
                  title="No payment attempts in this server window"
                  description="Try another complete UTC date range, currency or attempt status."
                />
              </div>
            )}
            <Pagination data={data.data} change={setPage} />
          </Panel>
        </>
      ) : (
        <ResourceState error={data.error} retry={data.reload} />
      )}
    </section>
  )
}
