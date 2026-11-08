'use client'
import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { BarChart3, Download, AlertTriangle, RotateCcw } from 'lucide-react'
import { PageHeading } from './page-heading'
import { Panel, EmptyState, SectionHeading } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field, controlClass } from '@/components/ui/field'
import { useAdminReady } from '@/components/providers'
import { useAdminStore } from '@/lib/store'
import { money, number } from '@/lib/utils'
import {
  buildReports,
  reportCsv,
  reportRangeError,
  type ReportPeriod,
  type ReportView,
} from '@/lib/reporting'
import { orderTotal } from '@/lib/fixtures'

const views: { id: ReportView; title: string }[] = [
  { id: 'sales', title: 'Sales & orders' },
  { id: 'products', title: 'Product performance' },
  { id: 'inventory', title: 'Inventory' },
  { id: 'customers', title: 'Customers' },
]
function Stat({
  title,
  value,
  hint,
}: {
  title: string
  value: string
  hint: string
}) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-bold text-muted">{title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Panel>
  )
}
function Chart({
  days,
}: {
  days: { date: string; valueUsd: number; count: number }[]
}) {
  const max = Math.max(...days.map((d) => d.valueUsd), 1)
  if (!days.length)
    return (
      <EmptyState
        title="No order value in this date range"
        description="Change the dates to explore sample order history."
      />
    )
  return (
    <div className="space-y-3" aria-label="Order value by day">
      {days.map((d) => (
        <div
          className="grid grid-cols-[100px_1fr_90px] items-center gap-3 text-xs"
          key={d.date}
        >
          <span className="font-semibold text-muted">{d.date}</span>
          <div
            className="h-4 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`${d.date}: ${money(d.valueUsd)}, ${d.count} orders`}
          >
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${(100 * d.valueUsd) / max}%` }}
            />
          </div>
          <span className="text-right font-bold">{money(d.valueUsd)}</span>
        </div>
      ))}
    </div>
  )
}
const head =
  'px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted'
const cell = 'px-4 py-3 text-sm'
export function Reports() {
  const ready = useAdminReady()
  const orders = useAdminStore((s) => s.orders)
  const products = useAdminStore((s) => s.products)
  const customers = useAdminStore((s) => s.customers)
  const stockEvents = useAdminStore((s) => s.stockEvents)
  const [view, setView] = useState<ReportView>('sales')
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const [period, setPeriod] = useState<ReportPeriod>('all')
  const [from, setFrom] = useState('2026-10-01')
  const [to, setTo] = useState('2026-10-18')
  const error = reportRangeError({ period, from, to })
  const data = useMemo(
    () =>
      buildReports(orders, products, customers, stockEvents, {
        period,
        from,
        to,
      }),
    [orders, products, customers, stockEvents, period, from, to],
  )
  const repeated = data.customers.filter((c) => c.orderCount >= 2).length
  const exportedCount =
    view === 'sales'
      ? data.orders.length
      : view === 'customers'
        ? data.customers.length
        : data.products.length
  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const keys: Record<string, number> = {
      ArrowRight: (index + 1) % views.length,
      ArrowLeft: (index - 1 + views.length) % views.length,
      Home: 0,
      End: views.length - 1,
    }
    const next = keys[event.key]
    if (next === undefined) return
    event.preventDefault()
    setView(views[next].id)
    tabs.current[next]?.focus()
  }
  function exportCurrent() {
    if (error) return
    const csv = reportCsv(view, data)
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `eshop-${view}-preview-${data.range.from ?? 'all'}-${data.range.to ?? 'all'}.csv`
    document.body.append(link)
    link.click()
    link.remove()
    // Allow the download to start before revoking the temporary URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  if (!ready)
    return <p className="text-sm text-muted">Loading saved report previews…</p>
  return (
    <>
      <PageHeading
        eyebrow="INSIGHTS / BROWSER PREVIEW"
        title="Analytics & reports"
        description="Review sample orders, product performance, stock and customers. No live sales or verified payment data."
        action={
          <Button
            onClick={exportCurrent}
            disabled={Boolean(error)}
            aria-label={`Export ${view} CSV`}
          >
            <Download size={16} /> Export CSV
          </Button>
        }
      />
      <Panel className="mb-5 flex items-start gap-3 bg-blue-50 p-4 text-sm text-blue-900">
        <BarChart3 className="mt-0.5 shrink-0" size={19} />
        <div>
          <strong>Local preview only.</strong> Order value is the sum of
          non-cancelled sample orders, not settled revenue. Refund values come
          from local order previews only. CSV export stays on your device.
        </div>
      </Panel>
      <Panel className="mb-5 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Date range">
            <select
              className={controlClass}
              aria-label="Report date range"
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            >
              <option value="all">All sample dates</option>
              <option value="last7">Latest 7 days</option>
              <option value="last30">Latest 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </Field>
          {period === 'custom' && (
            <>
              <Field label="From date">
                <input
                  aria-label="From date"
                  className={controlClass}
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="To date">
                <input
                  aria-label="To date"
                  className={controlClass}
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
            </>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setPeriod('all')
              setFrom('2026-10-01')
              setTo('2026-10-18')
            }}
          >
            <RotateCcw size={15} /> Reset dates
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <p className="mt-3 text-xs text-muted" data-testid="report-range-note">
          {period === 'all'
            ? 'All available sample order dates'
            : `Orders dated ${data.range.from ?? '—'} through ${data.range.to ?? '—'} (inclusive)`}
          .
          {period === 'last7' || period === 'last30'
            ? ` Relative to latest sample order (${data.range.reference}), not today's live date.`
            : ''}{' '}
          Inventory balances and customer directory reflect the current local
          preview, regardless of the order date filter.
        </p>
      </Panel>
      <div
        className="mb-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Report views"
      >
        {views.map(({ id, title }, index) => (
          <button
            key={id}
            id={`report-tab-${id}`}
            type="button"
            role="tab"
            aria-controls="report-panel"
            aria-selected={view === id}
            tabIndex={view === id ? 0 : -1}
            ref={(el) => {
              tabs.current[index] = el
            }}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${view === id ? 'bg-blue-600 text-white' : 'border border-line bg-white text-ink hover:bg-slate-50'}`}
            onClick={() => setView(id)}
          >
            {title}
          </button>
        ))}
      </div>
      <div
        id="report-panel"
        role="tabpanel"
        aria-labelledby={`report-tab-${view}`}
      >
        {view === 'sales' && (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                title="Sample order value"
                value={money(data.bookedValueUsd)}
                hint="Excludes cancelled orders; not paid revenue"
              />
              <Stat
                title="Orders placed"
                value={number(data.placedCount)}
                hint={`${data.cancelledCount} cancelled in range`}
              />
              <Stat
                title="Average non-cancelled order"
                value={money(data.averageOrderValueUsd)}
                hint={`${data.nonCancelledCount} non-cancelled orders`}
              />
              <Stat
                title="Refund preview total"
                value={money(data.refundPreviewUsd)}
                hint="Not a real payment provider refund"
              />
            </div>
            <div className="mb-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
              <Panel className="p-5">
                <SectionHeading
                  title="Order value over time"
                  subtitle="USD · non-cancelled sample orders"
                />
                <div className="mt-6">
                  <Chart days={data.byDay} />
                </div>
              </Panel>
              <Panel className="p-5">
                <SectionHeading
                  title="Order status breakdown"
                  subtitle="Includes cancelled and pending sample orders"
                />
                <div className="mt-4 space-y-3">
                  {Object.entries(data.statusCounts).map(([label, count]) => (
                    <div
                      className="flex items-center justify-between border-b border-line pb-2 text-sm"
                      key={label}
                    >
                      <span>{label}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted">
                  Value after preview refunds:{' '}
                  {money(data.afterRefundPreviewUsd)} (illustrative).
                </p>
              </Panel>
            </div>
            <Panel className="overflow-hidden">
              <div className="p-5">
                <SectionHeading
                  title="Sample order ledger"
                  subtitle="Export this filtered selection as CSV"
                />
              </div>
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label="Sample order ledger table (scroll horizontally for more columns)"
              >
                <table className="min-w-[680px] w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        'Order',
                        'Date',
                        'Status',
                        'Destination',
                        'Order value',
                      ].map((h) => (
                        <th className={head} key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((o) => (
                      <tr className="border-t border-line" key={o.id}>
                        <td className={`${cell} font-bold`}>{o.id}</td>
                        <td className={cell}>{o.createdAt}</td>
                        <td className={cell}>{o.status}</td>
                        <td className={cell}>{o.country}</td>
                        <td className={cell}>{money(orderTotal(o))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!data.orders.length && (
                <EmptyState title="No orders for this date range" />
              )}
            </Panel>
          </>
        )}
        {view === 'products' && (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <Stat
                title="Catalog products"
                value={number(products.length)}
                hint="Includes inactive items"
              />
              <Stat
                title="Units in non-cancelled orders"
                value={number(data.products.reduce((s, p) => s + p.units, 0))}
                hint="Selected sample order dates"
              />
              <Stat
                title="Catalog items with orders"
                value={number(data.products.filter((p) => p.units > 0).length)}
                hint="Unique product IDs"
              />
            </div>
            <Panel className="overflow-hidden">
              <div className="p-5">
                <SectionHeading
                  title="Product performance"
                  subtitle="Item quantities and order value across selected non-cancelled orders"
                />
              </div>
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label="Product performance table (scroll horizontally for more columns)"
              >
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        'Product',
                        'SKU',
                        'Ordered units',
                        'Order value USD',
                        'Current stock',
                      ].map((h) => (
                        <th key={h} className={head}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p) => (
                      <tr key={p.id} className="border-t border-line">
                        <td className={`${cell} font-bold`}>{p.name}</td>
                        <td className={cell}>{p.sku}</td>
                        <td className={cell}>{p.units}</td>
                        <td className={cell}>{money(p.orderValueUsd)}</td>
                        <td className={cell}>{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
        {view === 'inventory' && (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <Stat
                title="Current stock units"
                value={number(data.inventory.totalUnits)}
                hint="Across local product/variant records"
              />
              <Stat
                title="Low-stock products"
                value={number(data.inventory.lowStock)}
                hint="1–9 available units"
              />
              <Stat
                title="Out-of-stock products"
                value={number(data.inventory.outOfStock)}
                hint="0 available units"
              />
            </div>
            <Panel className="overflow-hidden">
              <div className="p-5">
                <SectionHeading
                  title="Stock position"
                  subtitle="Current balances; not restricted by order date filter"
                />
              </div>
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label="Stock position table (scroll horizontally for more columns)"
              >
                <table className="min-w-[620px] w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Product', 'SKU', 'Stock units', 'Status'].map((h) => (
                        <th className={head} key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.products]
                      .sort((a, b) => a.stock - b.stock)
                      .map((p) => (
                        <tr className="border-t border-line" key={p.id}>
                          <td className={cell}>{p.name}</td>
                          <td className={cell}>{p.sku}</td>
                          <td className={cell}>{p.stock}</td>
                          <td className={cell}>
                            {p.stock === 0 ? (
                              <Badge kind="danger">Out of stock</Badge>
                            ) : p.stock < 10 ? (
                              <Badge kind="warning">Low stock</Badge>
                            ) : (
                              <Badge kind="success">Available</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel className="mt-5 p-5">
              <SectionHeading
                title="Recent preview adjustments"
                subtitle="Local stock edits only; no verified warehouse history"
              />
              {data.inventory.events.length ? (
                <ul className="mt-4 space-y-2">
                  {data.inventory.events.slice(0, 8).map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 text-xs"
                    >
                      <span>{e.note}</span>
                      <strong>
                        {e.delta > 0 ? '+' : ''}
                        {e.delta} units
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  No local adjustments recorded.
                </p>
              )}
            </Panel>
          </>
        )}
        {view === 'customers' && (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <Stat
                title="Sample customers"
                value={number(customers.length)}
                hint="Current local customer directory"
              />
              <Stat
                title="Customers with orders"
                value={number(
                  data.customers.filter((c) => c.orderCount > 0).length,
                )}
                hint="Non-cancelled orders in range"
              />
              <Stat
                title="Repeat customers"
                value={number(repeated)}
                hint="2+ non-cancelled orders in range"
              />
            </div>
            <Panel className="overflow-hidden">
              <div className="p-5">
                <SectionHeading
                  title="Customer insights"
                  subtitle="No live customer database or real payment history"
                />
              </div>
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label="Customer insights table (scroll horizontally for more columns)"
              >
                <table className="min-w-[720px] w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        'Customer',
                        'Destination',
                        'Order count',
                        'Order value USD',
                        'Joined',
                      ].map((h) => (
                        <th key={h} className={head}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((c) => (
                      <tr className="border-t border-line" key={c.id}>
                        <td className={`${cell} font-semibold`}>{c.name}</td>
                        <td className={cell}>{c.country}</td>
                        <td className={cell}>{c.orderCount}</td>
                        <td className={cell}>{money(c.orderValueUsd)}</td>
                        <td className={cell}>{c.joinedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-muted">
        <AlertTriangle size={15} /> CSV rows in this view: {exportedCount}.
        Figures are local previews; not accounting records.
      </p>
    </>
  )
}
