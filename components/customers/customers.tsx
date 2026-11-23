'use client'

import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
  MapPin,
} from 'lucide-react'
import AdminLink from '@/components/ui/admin-link'
import { useNavigationRouter } from '@/components/layout/navigation-provider'
import { useAuth } from '@/components/auth/auth-provider'
import { canVisit } from '@/lib/admin-access'
import {
  useResource,
  ErrorMessage,
  ResourceState,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { Badge, statusKind } from '@/components/ui/badge'
import { PageHeading } from '@/components/layout/page-heading'
import { displayDate, displayDateTime } from '@/lib/presentation'
import {
  customerInitials,
  customerPageCount,
  customerPageItems,
  customerResultRange,
  isCustomerId,
} from '@/lib/customer-presentation'

type Customer = {
  id: string
  email: string
  displayName: string
  status: string
  createdAt: string
  orderCount: number
  lastOrderAt: string | null
}
type CustomerDetailResponse = Customer & {
  savedAddressCount: number
  recentOrders: { id: string; status: string; createdAt: string }[]
}
type CustomerDirectoryResponse = {
  items: Customer[]
  total: number
  page: number
  limit: number
}

type DirectoryFilters = {
  page: number
  limit: number
  draft: string
  search: string
  status: string
}

function Avatar({
  name,
  email,
  size = 'md',
}: {
  name: string
  email: string
  size?: 'md' | 'lg'
}) {
  return (
    <span
      aria-hidden="true"
      className={
        'flex shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-black tracking-tight text-primary ' +
        (size === 'lg' ? 'h-16 w-16 text-xl' : 'h-11 w-11 text-sm')
      }
    >
      {customerInitials(name, email)}
    </span>
  )
}

function Status({ status }: { status: string }) {
  return <Badge kind={statusKind(status)}>{status.replaceAll('_', ' ')}</Badge>
}

function Metric({
  title,
  value,
  note,
}: {
  title: string
  value: number
  note: string
}) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums text-ink">
        {value.toLocaleString('en-US')}
      </p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </article>
  )
}

export function Customers() {
  const router = useNavigationRouter()
  const customerId = useSearchParams().get('customer')
  // List controls live above the detail switch so Back preserves the
  // current filter, search and page within this mounted workspace.
  const [filters, setFilters] = useState<DirectoryFilters>({
    page: 1,
    limit: 20,
    draft: '',
    search: '',
    status: '',
  })
  const back = () => router.push('/customers')

  if (customerId !== null) {
    if (!isCustomerId(customerId)) {
      return (
        <section>
          <PageHeading
            eyebrow="CUSTOMER MANAGEMENT"
            title="Invalid customer reference"
            description="Customer details require a complete customer UUID."
            action={
              <Button variant="secondary" onClick={back}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back to customers
              </Button>
            }
          />
          <ErrorMessage text="This customer reference is not valid." />
        </section>
      )
    }
    return <CustomerDetail key={customerId} id={customerId} back={back} />
  }

  return (
    <CustomerDirectory
      filters={filters}
      setFilters={setFilters}
      open={(id) => {
        if (isCustomerId(id))
          router.push('/customers?customer=' + encodeURIComponent(id))
      }}
    />
  )
}

function CustomerDirectory({
  filters,
  setFilters,
  open,
}: {
  filters: DirectoryFilters
  setFilters: Dispatch<SetStateAction<DirectoryFilters>>
  open: (id: string) => void
}) {
  const { page, limit, draft, search, status } = filters
  const resource = useResource<CustomerDirectoryResponse>(
    '/v1/admin/customers',
    {
      page,
      limit,
      search: search || undefined,
      status: status || undefined,
    },
  )
  const directory = resource.data
  const update = (values: Partial<DirectoryFilters>) =>
    setFilters((current) => ({ ...current, ...values }))

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    update({ search: draft.trim(), page: 1 })
  }

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="CUSTOMER MANAGEMENT"
        title="Customers"
        description="Browse customer accounts and recent order activity. Account details are read-only."
      />

      <form
        onSubmit={submitSearch}
        className="grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end"
        role="search"
        aria-label="Customer directory search"
      >
        <label className="min-w-0 text-xs font-bold text-muted">
          Customer name or email
          <span className="relative mt-2 block">
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 text-muted"
            />
            <input
              aria-label="Search customers"
              className="h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm font-medium text-ink outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-blue-100"
              maxLength={120}
              placeholder="Search email or display name"
              value={draft}
              onChange={(event) => update({ draft: event.target.value })}
            />
          </span>
        </label>
        <Button type="submit" className="lg:mb-0">
          Search customers
        </Button>
        <label className="text-xs font-bold text-muted">
          Account status
          <select
            aria-label="Filter customer status"
            className="mt-2 block h-10 w-full rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink lg:min-w-36"
            value={status}
            onChange={(event) =>
              update({ status: event.target.value, page: 1 })
            }
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </label>
        <Button
          type="button"
          variant="secondary"
          busy={resource.isRefreshing}
          pendingLabel="Refreshing…"
          aria-label="Refresh customers"
          title="Refresh customers"
          onClick={resource.reload}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </form>

      <ErrorMessage text={resource.error && directory ? resource.error : ''} />
      {directory ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              title="Matching customers"
              value={directory.total}
              note={
                search || status
                  ? 'For the selected search and status'
                  : 'Across all result pages'
              }
            />
            <Metric
              title="Results on this page"
              value={directory.items.length}
              note={`Maximum ${directory.limit} customers per page`}
            />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-ink">
                Customer directory
              </h2>
              <p className="mt-1 text-sm text-muted">
                Read-only account overview and order counts.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted">
              Rows per page
              <select
                aria-label="Customers per page"
                className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
                value={limit}
                onChange={(event) =>
                  update({ limit: Number(event.target.value), page: 1 })
                }
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div
            className="table-scroll hidden rounded-2xl border border-line bg-white shadow-sm md:block"
            role="region"
            tabIndex={0}
            aria-label="Customers table"
          >
            <table className="admin-table min-w-[850px]">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Joined</th>
                  <th>Last order</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {directory.items.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={customer.displayName}
                          email={customer.email}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-ink">
                            {customer.displayName || 'Customer'}
                          </p>
                          <p className="mt-1 break-all text-xs text-muted">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Status status={customer.status} />
                    </td>
                    <td className="font-bold tabular-nums">
                      {customer.orderCount.toLocaleString('en-US')}
                    </td>
                    <td className="whitespace-nowrap">
                      <time dateTime={customer.createdAt}>
                        {displayDate(customer.createdAt)}
                      </time>
                    </td>
                    <td className="whitespace-nowrap">
                      {customer.lastOrderAt ? (
                        <time dateTime={customer.lastOrderAt}>
                          {displayDate(customer.lastOrderAt)}
                        </time>
                      ) : (
                        <span className="text-muted">No orders</span>
                      )}
                    </td>
                    <td className="text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => open(customer.id)}
                      >
                        View details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!directory.items.length && <EmptyCustomers />}
          </div>

          <div className="space-y-3 md:hidden" aria-label="Customers list">
            {directory.items.map((customer) => (
              <article
                key={customer.id}
                data-testid="customer-card"
                className="admin-offscreen-card rounded-2xl border border-line bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={customer.displayName}
                      email={customer.email}
                    />
                    <div className="min-w-0">
                      <p className="font-extrabold text-ink">
                        {customer.displayName || 'Customer'}
                      </p>
                      <p className="break-all text-xs text-muted">
                        {customer.email}
                      </p>
                    </div>
                  </div>
                  <Status status={customer.status} />
                </div>
                <div className="my-4 grid grid-cols-2 gap-3 border-y border-line py-3 text-sm">
                  <div>
                    <p className="text-xs text-muted">Orders</p>
                    <p className="mt-1 font-bold tabular-nums text-ink">
                      {customer.orderCount.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Joined</p>
                    <p className="mt-1 font-semibold text-ink">
                      <time dateTime={customer.createdAt}>
                        {displayDate(customer.createdAt)}
                      </time>
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted">Last order</p>
                    <p className="mt-1 font-semibold text-ink">
                      {customer.lastOrderAt ? (
                        <time dateTime={customer.lastOrderAt}>
                          {displayDate(customer.lastOrderAt)}
                        </time>
                      ) : (
                        'No orders'
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => open(customer.id)}
                >
                  View details
                </Button>
              </article>
            ))}
            {!directory.items.length && (
              <div className="rounded-2xl border border-line bg-white">
                <EmptyCustomers />
              </div>
            )}
          </div>

          <CustomerPagination
            data={directory}
            change={(next) => update({ page: next })}
          />
        </>
      ) : (
        <ResourceState error={resource.error} retry={resource.reload} />
      )}
    </section>
  )
}

function EmptyCustomers() {
  return (
    <div className="p-10 text-center">
      <Users size={28} aria-hidden="true" className="mx-auto text-slate-400" />
      <p className="mt-3 font-bold text-ink">No customers found</p>
      <p className="mt-1 text-sm text-muted">
        Try a different name, email or account status.
      </p>
    </div>
  )
}

function CustomerPagination({
  data,
  change,
}: {
  data: CustomerDirectoryResponse
  change: (page: number) => void
}) {
  const totalPages = customerPageCount(data.total, data.limit)
  const { start, end } = customerResultRange(data.total, data.page, data.limit)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted" aria-live="polite">
        Showing{' '}
        <span className="font-semibold tabular-nums text-ink">
          {start}–{end}
        </span>{' '}
        of{' '}
        <span className="font-semibold tabular-nums text-ink">
          {data.total.toLocaleString('en-US')}
        </span>{' '}
        {data.total === 1 ? 'customer' : 'customers'}
      </p>
      {totalPages > 1 && (
        <nav
          aria-label="Customers pagination"
          className="flex flex-wrap items-center gap-1"
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 w-9 px-0"
            aria-label="Previous page"
            disabled={data.page <= 1}
            onClick={() => change(data.page - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          {customerPageItems(data.page, totalPages).map((item) =>
            typeof item === 'number' ? (
              <Button
                key={item}
                type="button"
                variant={item === data.page ? 'primary' : 'ghost'}
                size="sm"
                className="h-9 min-w-9 px-2 tabular-nums disabled:cursor-default disabled:opacity-100"
                aria-label={`Page ${item}`}
                aria-current={item === data.page ? 'page' : undefined}
                disabled={item === data.page}
                onClick={() => change(item)}
              >
                {item}
              </Button>
            ) : (
              <span
                key={item}
                aria-hidden="true"
                className="flex h-9 min-w-7 items-center justify-center px-1 text-sm text-muted"
              >
                …
              </span>
            ),
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 w-9 px-0"
            aria-label="Next page"
            disabled={data.page >= totalPages}
            onClick={() => change(data.page + 1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}

function CustomerDetail({ id, back }: { id: string; back: () => void }) {
  const resource = useResource<CustomerDetailResponse>(
    '/v1/admin/customers/' + id,
  )
  const { session } = useAuth()
  const canOpenOrders = canVisit('/orders', session.user)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const customer = resource.data

  async function copyId() {
    setCopyError('')
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(id)
      setCopied(true)
    } catch {
      setCopyError(
        'Clipboard access is unavailable. You can select the full customer reference below.',
      )
    }
  }

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="CUSTOMER MANAGEMENT"
        title="Customer details"
        description="Read-only account overview and recent order activity."
        action={
          <Button type="button" variant="secondary" onClick={back}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to customers
          </Button>
        }
      />
      {!customer ? (
        <ResourceState
          variant="detail"
          error={resource.error}
          retry={resource.reload}
        />
      ) : (
        <>
          <article className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar
                  name={customer.displayName}
                  email={customer.email}
                  size="lg"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-black tracking-tight text-ink">
                    {customer.displayName || 'Customer'}
                  </h2>
                  <p className="mt-1 break-all text-sm text-muted">
                    {customer.email}
                  </p>
                  <div className="mt-2">
                    <Status status={customer.status} />
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                busy={resource.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={resource.reload}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Refresh customer
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <span className="text-xs font-semibold text-muted">
                Customer UUID
              </span>
              <code className="min-w-0 break-all text-xs font-semibold text-ink">
                {customer.id}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Copy full customer UUID"
                onClick={() => void copyId()}
              >
                {copied ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <ErrorMessage text={copyError} />
          </article>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              title="Total orders"
              value={customer.orderCount}
              note="Across the customer's order history"
            />
            <Metric
              title="Saved addresses"
              value={customer.savedAddressCount}
              note="Count only; address contents are private"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <section className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-xl bg-blue-50 p-2.5 text-primary">
                  <ShoppingBag size={19} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-ink">
                    Recent orders
                  </h3>
                  <p className="text-xs text-muted">
                    Up to five most recent orders from the Backend
                  </p>
                </div>
              </div>
              {customer.recentOrders.length ? (
                <div className="space-y-3">
                  {customer.recentOrders.map((order) => (
                    <article
                      key={order.id}
                      className="admin-offscreen-card rounded-xl border border-line p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="font-extrabold tracking-wide text-ink"
                            title={order.id}
                          >
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            <time dateTime={order.createdAt}>
                              {displayDateTime(order.createdAt)}
                            </time>
                          </p>
                        </div>
                        <Status status={order.status} />
                      </div>
                      {canOpenOrders && (
                        <AdminLink
                          href={'/orders?order=' + encodeURIComponent(order.id)}
                          className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-xs font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          View order details{' '}
                          <ChevronRight size={15} aria-hidden="true" />
                        </AdminLink>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-muted">
                  No orders yet.
                </div>
              )}
            </section>
            <aside className="min-w-0 space-y-4">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h3 className="font-extrabold text-ink">Account information</h3>
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Account status</dt>
                    <dd className="mt-1">
                      <Status status={customer.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Joined</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      <time dateTime={customer.createdAt}>
                        {displayDateTime(customer.createdAt)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Last order</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {customer.lastOrderAt ? (
                        <time dateTime={customer.lastOrderAt}>
                          {displayDateTime(customer.lastOrderAt)}
                        </time>
                      ) : (
                        'No orders'
                      )}
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin size={17} aria-hidden="true" />
                  <h3 className="font-extrabold">Private account data</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  This directory shows saved-address counts only. Address
                  contents, payment instruments and financial performance are
                  not exposed.
                </p>
              </section>
            </aside>
          </div>
          <ErrorMessage text={resource.error} />
        </>
      )}
    </section>
  )
}
