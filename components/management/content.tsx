'use client'
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
import { SpecForm, DataView, type Row } from './shared'
export function LiveContent() {
  const [kind, setKind] = useState<'banners' | 'collections'>('banners')
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Store content</h1>
      <p className="text-sm text-muted">
        Draft, published and archived states are explicit. Publication windows
        use inclusive start/exclusive end. Images must use verified Media
        Library UUIDs; collection products must be canonical IDs. Homepage
        publication never sends messages.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => setKind('banners')}>Banners</Button>
        <Button onClick={() => setKind('collections')}>Collections</Button>
      </div>
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
  const refresh = () => {
    setEdit(undefined)
    r.reload()
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-bold">
          Publication status
          <select
            className={fieldClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All</option>
            {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Button onClick={() => setEdit(null)}>
          Create {kind === 'banners' ? 'banner' : 'collection'}
        </Button>
        <Button variant="secondary" onClick={refresh}>
          Refresh content
        </Button>
      </div>
      <ErrorMessage text={error} />
      {edit !== undefined && (
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
          title={'Save ' + (kind === 'banners' ? 'banner' : 'collection')}
        />
      )}
      {r.data ? (
        <>
          <div className="space-y-4">
            {r.data.items.map((row) => (
              <article
                key={String(row.id)}
                className="space-y-4 rounded-2xl border bg-white p-5"
              >
                <DataView value={row} />
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true)
                      setError('')
                      void api
                        .request<Row>(route + '/' + row.id)
                        .then(setEdit)
                        .catch((e) => setError(e.message))
                        .finally(() => setBusy(false))
                    }}
                  >
                    Edit current {kind === 'banners' ? 'banner' : 'collection'}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busy || row.status === 'ARCHIVED'}
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Archive this published content using its current revision?',
                        )
                      )
                        return
                      setBusy(true)
                      void api
                        .request(route + '/' + row.id, {
                          method: 'DELETE',
                          query: { expectedRevision: Number(row.revision) },
                        })
                        .then(refresh)
                        .catch((e) => {
                          setError(e.message)
                          r.reload()
                        })
                        .finally(() => setBusy(false))
                    }}
                  >
                    Archive content
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <Pagination data={r.data} change={setPage} />
        </>
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </div>
  )
}
