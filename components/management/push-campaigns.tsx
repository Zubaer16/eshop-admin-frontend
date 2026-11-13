'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import { useAuth } from '@/components/auth/auth-provider'
import {
  useResource,
  ResourceState,
  ErrorMessage,
  Pagination,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { SpecForm, DataView, type Row } from './shared'
export function Messaging() {
  const { session } = useAuth(),
    owner = session.user?.role === 'OWNER',
    [page, setPage] = useState(1),
    [edit, setEdit] = useState<Row | null | undefined>(),
    [approve, setApprove] = useState<Row | null>(null),
    [detail, setDetail] = useState<unknown>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    r = useResource<{
      items: Row[]
      page: number
      limit: number
      pages: number
      total: number
    }>('/v1/admin/push/campaigns', { page, limit: 20 })
  const refresh = () => {
    setEdit(undefined)
    setApprove(null)
    setDetail(null)
    r.reload()
  }
  return (
    <section className="space-y-6">
      <PageHeading title="Rich messaging campaigns" />
      <p className="text-sm text-muted">
        Marketing consent is required. Draft/edit and preview do not send. OWNER
        approval schedules fanout; provider acceptance is not device display.
        Only verified media and published canonical targets are allowed. Editing
        invalidates earlier approval.
      </p>
      <Button onClick={() => setEdit(null)}>Create push campaign draft</Button>
      <Button variant="secondary" onClick={refresh}>
        Refresh campaigns
      </Button>
      <ErrorMessage text={error} />
      {edit !== undefined && (
        <SpecForm
          key={String(edit?.id || 'new') + ':' + String(edit?.revision || 0)}
          contract="SavePushCampaignDto"
          row={
            edit || { audience: 'ALL_OPTED_IN_CUSTOMERS', targetType: 'HOME' }
          }
          route={'/v1/admin/push/campaigns' + (edit ? '/' + edit.id : '')}
          method={edit ? 'PUT' : 'POST'}
          done={refresh}
          title="Save campaign draft"
        />
      )}
      {approve && owner && (
        <SpecForm
          key={String(approve.id) + ':' + String(approve.revision)}
          contract="ApprovePushCampaignDto"
          row={approve}
          route={'/v1/admin/push/campaigns/' + approve.id + '/approve'}
          method="POST"
          done={refresh}
          title="Approve campaign schedule"
        />
      )}
      {detail !== null && <DataView value={detail} />}
      {r.data ? (
        <>
          <div className="space-y-4">
            {r.data.items.map((row) => (
              <article
                key={String(row.id)}
                className="space-y-3 rounded-xl border bg-white p-5"
              >
                <DataView value={row} />
                <div className="flex flex-wrap gap-3">
                  {['edit', 'preview', 'metrics'].map((action) => (
                    <Button
                      key={action}
                      variant="secondary"
                      disabled={
                        busy || (action === 'edit' && row.status !== 'DRAFT')
                      }
                      onClick={() => {
                        setBusy(true)
                        setError('')
                        void api
                          .request<Row>(
                            '/v1/admin/push/campaigns/' +
                              row.id +
                              (action === 'edit' ? '' : '/' + action),
                          )
                          .then((value) =>
                            action === 'edit'
                              ? setEdit(value)
                              : setDetail(value),
                          )
                          .catch((e) => setError(e.message))
                          .finally(() => setBusy(false))
                      }}
                    >
                      {action === 'edit'
                        ? 'Edit draft'
                        : action === 'preview'
                          ? 'Preview eligible recipients'
                          : 'Read campaign metrics'}
                    </Button>
                  ))}
                  {owner && row.status === 'DRAFT' && (
                    <Button disabled={busy} onClick={() => setApprove(row)}>
                      Review owner approval
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Cancel future fanout? Already submitted notifications cannot be recalled.',
                        )
                      )
                        return
                      setBusy(true)
                      void api
                        .request(
                          '/v1/admin/push/campaigns/' + row.id + '/cancel',
                          {
                            method: 'POST',
                            body: { expectedRevision: row.revision },
                          },
                        )
                        .then(refresh)
                        .catch((e) => {
                          setError(e.message)
                          r.reload()
                        })
                        .finally(() => setBusy(false))
                    }}
                  >
                    Cancel campaign
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
    </section>
  )
}
