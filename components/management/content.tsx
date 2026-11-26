'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import {
  useResource,
  ResourceState,
  Pagination,
  ErrorMessage,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/components/commerce/forms'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, SectionHeading } from '@/components/ui/panel'
import {
  AdminEmptyState,
  AdminNotice,
  AdminTabs,
} from '@/components/ui/admin-workspace'
import { displayDateTime } from '@/lib/presentation'
import { SpecForm, DataView, type Row } from './shared'

export function StoreContent() {
  const [kind, setKind] = useState<'banners' | 'collections'>('banners')
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="STOREFRONT MERCHANDISING"
        title="Store content"
        description="Manage homepage banners and featured product collections using the current publication rules."
      />
      <AdminNotice title="Publication rules">
        Draft, published and archived states are explicit. Publication windows
        use inclusive start and exclusive end. Images must use verified Media
        Library UUIDs; collection products must be canonical IDs. Homepage
        publication never sends messages.
      </AdminNotice>
      <Panel className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-ink">Content workspace</p>
            <p className="mt-1 text-xs text-muted">
              Choose the content type you want to manage.
            </p>
          </div>
          <AdminTabs
            label="Store content type"
            value={kind}
            onChange={(value) => setKind(value as 'banners' | 'collections')}
            items={[
              { value: 'banners', label: 'Banners' },
              { value: 'collections', label: 'Featured collections' },
            ]}
          />
        </div>
      </Panel>
      <ContentList key={kind} kind={kind} />
    </section>
  )
}

function ContentList({ kind }: { kind: 'banners' | 'collections' }) {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(''),
    [edit, setEdit] = useState<Row | null | undefined>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    route = '/v1/admin/store/' + kind,
    r = useResource<{
      items: Row[]
      page: number
      limit: number
      pages: number
      total: number
    }>(route, { page, limit: 20, status: status || undefined })
  const title = kind === 'banners' ? 'Banner directory' : 'Featured collections'
  const itemLabel = kind === 'banners' ? 'banner' : 'collection'
  const refresh = () => {
    setEdit(undefined)
    r.reload()
  }
  const archive = (row: Row) => {
    if (
      !window.confirm(
        'Archive this published content using its current revision?',
      )
    )
      return
    setBusy(true)
    setError('')
    void api
      .request(route + '/' + row.id, {
        method: 'DELETE',
        query: { expectedRevision: Number(row.revision) },
      })
      .then(refresh)
      .catch((reason) => {
        setError(
          reason instanceof Error ? reason.message : 'Archive not confirmed.',
        )
        r.reload()
      })
      .finally(() => setBusy(false))
  }
  const openEdit = (row: Row) => {
    setBusy(true)
    setError('')
    void api
      .request<Row>(route + '/' + row.id)
      .then(setEdit)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Record could not be loaded.',
        ),
      )
      .finally(() => setBusy(false))
  }
  const headline = (row: Row) =>
    String(row[kind === 'banners' ? 'headline' : 'title'] || row.slug || row.id)
  const secondary = (row: Row) =>
    String(row[kind === 'banners' ? 'subtitle' : 'slug'] || '')
  const schedule = (row: Row) => {
    const start =
      typeof row.startsAt === 'string' ? displayDateTime(row.startsAt) : ''
    const end =
      typeof row.endsAt === 'string' ? displayDateTime(row.endsAt) : ''
    if (!start && !end) return 'No publication window'
    return `${start || 'No start'} → ${end || 'No end'}`
  }
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <SectionHeading
          title={title}
          subtitle={
            r.data
              ? `${r.data.total.toLocaleString('en-US')} server records · 20 per page`
              : 'Server-managed content records'
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            busy={r.isRefreshing}
            pendingLabel="Refreshing…"
            onClick={refresh}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEdit(null)
              setError('')
            }}
          >
            Create {itemLabel}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line bg-slate-50/70 p-4 sm:px-5">
        <label className="block min-w-48 text-xs font-bold text-muted">
          Publication status
          <select
            className={fieldClass + ' mt-2'}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All publication states</option>
            {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">
          Changes are saved against the current server revision.
        </p>
      </div>
      <div className="px-4 sm:px-5">
        <ErrorMessage text={error} />
      </div>
      {edit !== undefined && (
        <div className="border-b border-line bg-blue-50/30 p-4 sm:p-5">
          <SpecForm
            key={String(edit?.id || 'new') + ':' + String(edit?.revision || 0)}
            contract={
              kind === 'banners'
                ? 'SaveStoreBannerDto'
                : 'SaveFeaturedCollectionDto'
            }
            row={edit || { status: 'DRAFT', position: 1 }}
            route={route + (edit ? '/' + edit.id : '')}
            method={edit ? 'PUT' : 'POST'}
            done={refresh}
            title={'Save ' + itemLabel}
          />
        </div>
      )}
      {r.data ? (
        <>
          <div
            className="table-scroll hidden md:block"
            tabIndex={0}
            role="region"
            aria-label={title}
          >
            <table className="admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Placement</th>
                  <th>Publication window</th>
                  <th>Revision</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {r.data.items.map((row) => (
                  <tr key={String(row.id)}>
                    <td className="min-w-56">
                      <p className="font-bold text-ink">{headline(row)}</p>
                      <p className="mt-1 max-w-sm truncate text-xs font-normal text-muted">
                        {secondary(row) || String(row.id)}
                      </p>
                    </td>
                    <td>
                      <Badge kind={statusKind(String(row.status || ''))}>
                        {String(row.status || 'Unknown')}
                      </Badge>
                    </td>
                    <td>{String(row.position ?? '—')}</td>
                    <td className="min-w-56 text-xs text-muted">
                      {schedule(row)}
                    </td>
                    <td className="tabular-nums">
                      {String(row.revision ?? '—')}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy || row.status === 'ARCHIVED'}
                          onClick={() => archive(row)}
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 md:hidden">
            {r.data.items.map((row) => (
              <article
                key={String(row.id)}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-extrabold text-ink">
                      {headline(row)}
                    </h3>
                    <p className="mt-1 break-words text-xs text-muted">
                      {secondary(row) || String(row.id)}
                    </p>
                  </div>
                  <Badge kind={statusKind(String(row.status || ''))}>
                    {String(row.status || 'Unknown')}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-muted">Position</dt>
                    <dd className="mt-1 font-bold text-ink">
                      {String(row.position ?? '—')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Revision</dt>
                    <dd className="mt-1 font-bold tabular-nums text-ink">
                      {String(row.revision ?? '—')}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted">Publication window</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {schedule(row)}
                    </dd>
                  </div>
                </dl>
                <details className="mt-3 border-t border-line pt-3">
                  <summary className="cursor-pointer text-xs font-bold text-primary">
                    View record details
                  </summary>
                  <div className="mt-3">
                    <DataView value={row} />
                  </div>
                </details>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => openEdit(row)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busy || row.status === 'ARCHIVED'}
                    onClick={() => archive(row)}
                  >
                    Archive
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {!r.data.items.length && (
            <div className="p-4 sm:p-5">
              <AdminEmptyState
                title={`No ${kind} in this view`}
                description={
                  status
                    ? 'Try another publication state or create a new record.'
                    : `Create the first ${itemLabel} when you are ready to publish store content.`
                }
              />
            </div>
          )}
          <Pagination data={r.data} change={setPage} />
        </>
      ) : (
        <div className="p-4 sm:p-5">
          <ResourceState error={r.error} retry={r.reload} />
        </div>
      )}
    </Panel>
  )
}
