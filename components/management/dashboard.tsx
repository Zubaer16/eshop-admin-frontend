'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  Box,
  ShoppingBag,
  Users,
  Wallet,
  PackageCheck,
  TrendingUp,
} from 'lucide-react'
import { useResource, ResourceState } from '@/components/catalog/shared'
import { PageHeading } from '@/components/layout/page-heading'
import { Panel, SectionHeading, EmptyState } from '@/components/ui/panel'
import { Badge, statusKind } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMinor, displayDate } from '@/lib/presentation'

type CurrencyTotal = {
  currency: string
  paidMinor: string
  refundedMinor: string
  netCollectedMinor: string
  paidOrderCount: number
}
type Overview = {
  window: { from?: string; to?: string; asOf?: string }
  available: {
    financial: boolean
    orders: boolean
    catalog: boolean
    customers: boolean
    inventory: boolean
  }
  financial: {
    byCurrency: CurrencyTotal[]
    placedOrdersByCurrentStatus: { status: string; count: number }[]
  } | null
  recentOrders:
    | {
        id: string
        status: string
        currency: string
        totalMinor: number
        createdAt: string
        fulfillmentStatus: string | null
      }[]
    | null
  inventory:
    | {
        currency: string
        lowStockCount: number
        availableUnits: string
        skuCount: number
      }[]
    | null
  products: number | null
  activeProducts: number | null
  customers: number | null
}
export function Dashboard() {
  const resource = useResource<Overview>('/v1/admin/dashboard/overview')
  const [currency, setCurrency] = useState('USD')
  const data = resource.data
  const totals = data?.financial?.byCurrency || []
  const selected =
    totals.find((item) => item.currency === currency) || totals[0]
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="THE BIG PICTURE"
        title="Good to see you again."
        description="Here is what's happening across your store."
        action={
          <Link href="/products">
            <Button>
              <ShoppingBag size={16} />
              Manage products
              <ArrowRight size={15} />
            </Button>
          </Link>
        }
      />
      {!data ? (
        <ResourceState error={resource.error} retry={resource.reload} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Net collections"
              detail={
                selected
                  ? selected.currency + ' · TEST payments'
                  : 'No authorized collection total'
              }
              icon={Wallet}
            >
              {selected
                ? formatMinor(selected.netCollectedMinor, selected.currency)
                : 'Unavailable'}
            </Metric>
            <Metric
              label="Recent orders"
              detail="Latest records in the reporting window"
              icon={ShoppingBag}
            >
              {data.available.orders && data.recentOrders
                ? data.recentOrders.length
                : 'Unavailable'}
            </Metric>
            <Metric
              label="Active products"
              detail={
                data.products === null
                  ? 'Catalog summary unavailable'
                  : data.products + ' total products'
              }
              icon={Box}
            >
              {data.activeProducts ?? 'Unavailable'}
            </Metric>
            <Metric
              label="Customers"
              detail="Current customer accounts"
              icon={Users}
            >
              {data.customers ?? 'Unavailable'}
            </Metric>
          </div>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
            <Panel className="min-w-0 p-5 sm:p-6">
              <SectionHeading
                title="Collections performance"
                subtitle="Confirmed collections and refunds · TEST scope"
                action={
                  <Badge kind="info">
                    <TrendingUp size={13} />
                    Store overview
                  </Badge>
                }
              />
              {data.available.financial ? (
                <>
                  <div className="my-5 flex flex-wrap items-center justify-between gap-3">
                    <strong className="min-w-0 break-all text-3xl font-black tracking-tight">
                      {selected
                        ? formatMinor(
                            selected.netCollectedMinor,
                            selected.currency,
                          )
                        : 'No collections'}
                    </strong>
                    <label className="text-xs font-bold text-muted">
                      Currency
                      <select
                        aria-label="Dashboard currency"
                        value={selected?.currency || currency}
                        onChange={(event) => setCurrency(event.target.value)}
                        className="ml-2 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                      >
                        {(totals.length
                          ? totals.map((item) => item.currency)
                          : ['USD']
                        ).map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <CollectionChart currency={selected?.currency || currency} />
                  {selected && (
                    <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
                      <div>
                        <dt className="text-xs text-muted">Collected</dt>
                        <dd className="mt-2 break-all font-extrabold">
                          {formatMinor(selected.paidMinor, selected.currency)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">Refunded</dt>
                        <dd className="mt-2 break-all font-extrabold">
                          {formatMinor(
                            selected.refundedMinor,
                            selected.currency,
                          )}
                        </dd>
                      </div>
                    </dl>
                  )}
                </>
              ) : (
                <EmptyState
                  title="Collection summary unavailable"
                  description="Your current permissions do not include this summary."
                />
              )}
            </Panel>
            <Panel className="p-5 sm:p-6">
              <SectionHeading
                title="Inventory overview"
                subtitle="Current physical stock and availability"
              />
              {data.inventory?.length ? (
                <div className="mt-5 space-y-4">
                  {data.inventory.map((item) => (
                    <div
                      key={item.currency}
                      className="rounded-xl border border-line bg-canvas p-4"
                    >
                      <p className="text-xs font-bold text-muted">
                        {item.currency}
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {item.availableUnits}
                        <span className="ml-2 text-xs font-normal text-muted">
                          available units
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        {item.skuCount} SKUs · {item.lowStockCount} low stock
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={
                    data.available.inventory
                      ? 'No inventory summary'
                      : 'Inventory summary unavailable'
                  }
                />
              )}
              <Link
                href="/inventory"
                className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-primary"
              >
                Review inventory
                <ArrowRight size={14} />
              </Link>
            </Panel>
          </div>
          <Panel className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <SectionHeading
                title="Recent orders"
                subtitle="Current order and shipment states"
                action={
                  <Link
                    href="/orders"
                    className="text-xs font-bold text-primary"
                  >
                    View all orders →
                  </Link>
                }
              />
            </div>
            {data.recentOrders?.length ? (
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Recent orders table"
              >
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Placed</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Shipment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span
                            className="block max-w-44 truncate"
                            title={row.id}
                          >
                            {row.id}
                          </span>
                        </td>
                        <td>{displayDate(row.createdAt)}</td>
                        <td>{formatMinor(row.totalMinor, row.currency)}</td>
                        <td>
                          <Badge kind={statusKind(row.status)}>
                            {row.status.replaceAll('_', ' ')}
                          </Badge>
                        </td>
                        <td>{row.fulfillmentStatus || 'Not started'}</td>
                        <td>
                          <Link
                            href={'/orders?order=' + row.id}
                            className="text-xs font-bold text-primary"
                          >
                            View order
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title={
                  data.available.orders
                    ? 'No orders in this window'
                    : 'Order summary unavailable'
                }
              />
            )}
          </Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span className="flex items-center gap-2">
              <PackageCheck size={15} />
              Current store data; totals retain their original currency.
            </span>
            <Button variant="ghost" size="sm" onClick={resource.reload}>
              Refresh dashboard
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
function Metric({
  label,
  detail,
  icon: Icon,
  children,
}: {
  label: string
  detail: string
  icon: typeof Wallet
  children: React.ReactNode
}) {
  return (
    <Panel className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted">{label}</p>
          <p className="mt-3 break-words text-[27px] font-black tracking-tight">
            {children}
          </p>
          <p className="mt-1 text-xs text-muted">{detail}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-primary">
          <Icon size={20} />
        </div>
      </div>
    </Panel>
  )
}
function CollectionChart({ currency }: { currency: string }) {
  const r = useResource<{
    items: { date: string; netCollectedMinor: string }[]
  }>('/v1/admin/reports/daily', { currency })
  if (!r.data) return <ResourceState error={r.error} retry={r.reload} />
  const rows = r.data.items.filter((item) =>
    /^-?\d+$/.test(item.netCollectedMinor),
  )
  if (!rows.length)
    return <EmptyState title="No daily collections to display" />
  const values = rows.map((item) => BigInt(item.netCollectedMinor)),
    minimum = values.reduce((a, b) => (a < b ? a : b)),
    maximum = values.reduce((a, b) => (a > b ? a : b)),
    span = maximum - minimum || BigInt(1)
  const points = values.map(
    (value, index) =>
      `${20 + (index / Math.max(1, values.length - 1)) * 660},${170 - Number(((value - minimum) * BigInt(14000)) / span) / 100}`,
  )
  return (
    <div>
      <svg
        role="img"
        aria-label={'Daily net collections in ' + currency}
        viewBox="0 0 700 200"
        className="metric-line h-[200px] w-full"
      >
        <title>Daily net collections in {currency}</title>
        {[30, 65, 100, 135, 170].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="680"
            y2={y}
            stroke="#e5eaf2"
            strokeDasharray="4 5"
          />
        ))}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#2459e8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between gap-3 text-[11px] text-muted">
        <span>{rows[0].date}</span>
        <span>{rows.at(-1)?.date}</span>
      </div>
      <p className="mt-3 text-xs text-muted">
        Range: {formatMinor(minimum.toString(), currency)} –{' '}
        {formatMinor(maximum.toString(), currency)}
      </p>
    </div>
  )
}
