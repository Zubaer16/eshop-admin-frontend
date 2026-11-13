'use client'
import { useState } from 'react'
import {
  useResource,
  ErrorMessage,
  ResourceState,
} from '@/components/catalog/shared'
import { Panel } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { controlClass } from '@/components/ui/field'
import { PageHeading } from '@/components/layout/page-heading'
type Customer = {
  id: string
  email: string
  displayName: string
  status: string
  createdAt: string
  orderCount: number
  lastOrderAt: string | null
}
type Detail = Customer & {
  savedAddressCount: number
  recentOrders: { id: string; status: string; createdAt: string }[]
}
type Directory = {
  items: Customer[]
  total: number
  page: number
  limit: number
}
export function Customers() {
  const [page, setPage] = useState(1),
    [query, setQuery] = useState(''),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [selected, setSelected] = useState('')
  const resource = useResource<Directory>('/v1/admin/customers', {
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
  })
  return (
    <>
      <PageHeading
        eyebrow="CUSTOMER DIRECTORY"
        title="Customers"
        description="Read-only account and order activity. Private addresses and financial performance are separate."
      />
      <Panel>
        <form
          className="flex flex-wrap gap-3 border-b border-line p-4"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(query.trim())
            setPage(1)
          }}
        >
          <input
            className={controlClass + ' max-w-sm'}
            aria-label="Search customers"
            placeholder="Email or display name"
            maxLength={120}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search customers
          </Button>
          <select
            className={controlClass + ' w-auto'}
            aria-label="Filter customer status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <Button type="button" variant="ghost" onClick={resource.reload}>
            Refresh customers
          </Button>
        </form>
        {!resource.data ? (
          <ResourceState error={resource.error} retry={resource.reload} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead className="bg-slate-50 text-xs text-muted">
                  <tr>
                    {[
                      'Customer',
                      'Status',
                      'Orders',
                      'Joined',
                      'Last order',
                      'Details',
                    ].map((label) => (
                      <th className="p-4" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {resource.data.items.map((customer) => (
                    <tr key={customer.id}>
                      <td className="p-4">
                        <p className="font-bold">
                          {customer.displayName || 'Customer'}
                        </p>
                        <p className="mt-1 break-all text-xs text-muted">
                          {customer.email}
                        </p>
                      </td>
                      <td className="p-4">{customer.status}</td>
                      <td className="p-4">{customer.orderCount}</td>
                      <td className="p-4">{customer.createdAt}</td>
                      <td className="p-4">
                        {customer.lastOrderAt || 'No orders'}
                      </td>
                      <td className="p-4">
                        <Button
                          variant="secondary"
                          onClick={() => setSelected(customer.id)}
                        >
                          View customer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!resource.data.items.length && (
                <p className="p-8 text-sm text-muted">
                  No customers match these filters.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 text-sm">
              <span>
                {resource.data.total} customers · Page {resource.data.page} of{' '}
                {Math.max(
                  1,
                  Math.ceil(resource.data.total / resource.data.limit),
                )}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={page * resource.data.limit >= resource.data.total}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>
      <Modal
        open={Boolean(selected)}
        title="Customer account overview"
        description="Server-projected account metadata and up to five recent order statuses."
        onOpenChange={(open) => {
          if (!open) setSelected('')
        }}
      >
        {selected && <CustomerDetail key={selected} id={selected} />}
      </Modal>
    </>
  )
}
function CustomerDetail({ id }: { id: string }) {
  const resource = useResource<Detail>('/v1/admin/customers/' + id)
  if (!resource.data)
    return <ResourceState error={resource.error} retry={resource.reload} />
  const customer = resource.data
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-slate-50 p-4">
        <h2 className="font-bold">{customer.displayName || 'Customer'}</h2>
        <p className="mt-2 break-all text-sm">{customer.email}</p>
        <p className="mt-2 text-sm">
          {customer.status} · Joined {customer.createdAt}
        </p>
        <p className="mt-2 text-sm">
          {customer.orderCount} orders · {customer.savedAddressCount} saved
          addresses
        </p>
        <p className="mt-2 text-xs text-muted">
          Private address contents and payment details are not exposed by this
          directory.
        </p>
      </div>
      <h3 className="font-bold">Most recent orders (up to five)</h3>
      {customer.recentOrders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl border border-line p-3 text-sm"
        >
          <p className="break-all font-semibold">{order.id}</p>
          <p className="mt-2">
            {order.status} · {order.createdAt}
          </p>
        </div>
      ))}
      {!customer.recentOrders.length && (
        <p className="text-sm text-muted">No orders yet.</p>
      )}
      <ErrorMessage text={resource.error} />
      <Button variant="secondary" onClick={resource.reload}>
        Refresh customer
      </Button>
    </div>
  )
}
