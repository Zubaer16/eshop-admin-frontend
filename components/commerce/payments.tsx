'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import {
  useResource,
  ResourceState,
  Pagination,
} from '@/components/catalog/shared'
import { money, type Page } from '@/lib/api/catalog'
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
      <PageHeading title="TEST payment records" />
      <p className="text-sm text-muted">
        Preparation and confirmed settlement are separate. These records do not
        prove live payments. Refunds shown are lifetime confirmed amounts; no
        browser-calculated financial totals.
      </p>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="text-sm font-bold">
          Currency (optional)
          <input
            className={fieldClass}
            value={currency}
            maxLength={3}
            onChange={(e) => {
              setCurrency(e.target.value.toUpperCase())
              setPage(1)
            }}
          />
        </label>
        <label className="text-sm font-bold">
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
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
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
        <label className="text-sm font-bold">
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
      {Boolean(from) !== Boolean(to) && (
        <p role="status" className="text-sm text-amber-800">
          Select both UTC dates to apply the date filter. The server default
          window is currently shown.
        </p>
      )}
      <button className="text-sm font-bold text-primary" onClick={data.reload}>
        Refresh payment records
      </button>
      {data.data ? (
        <>
          <p className="text-xs text-muted">
            {data.data.window.from} to {data.data.window.to} ·{' '}
            {data.data.window.timeZone} · as of {data.data.window.asOf} ·{' '}
            {data.data.window.paymentScope}
          </p>
          <div className="space-y-3">
            {data.data.items.map((row) => (
              <article
                key={row.id}
                className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="break-all font-bold">Order {row.orderId}</p>
                <p className="text-sm">
                  Preparation: {row.attemptStatus} · Collection:{' '}
                  {row.collectionState}
                </p>
                <p className="text-sm">
                  Attempted: {money(row.attemptedMinor, row.currency)} ·
                  Settled:{' '}
                  {row.settledMinor === null
                    ? 'Unconfirmed'
                    : money(row.settledMinor, row.currency)}
                </p>
                <p className="text-sm">
                  Lifetime refunded: {row.lifetimeRefundedMinor} {row.currency}{' '}
                  minor units
                </p>
                <p className="text-xs text-muted">
                  Created {row.createdAt} · Settled{' '}
                  {row.settledAt || 'Not confirmed'}
                </p>
              </article>
            ))}
            {!data.data.items.length && (
              <p>No payment attempts in this server window.</p>
            )}
          </div>
          <Pagination data={data.data} change={setPage} />
        </>
      ) : (
        <ResourceState error={data.error} retry={data.reload} />
      )}
    </section>
  )
}
