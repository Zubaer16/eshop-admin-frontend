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
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, SectionHeading } from '@/components/ui/panel'
import { AdminEmptyState, AdminNotice } from '@/components/ui/admin-workspace'
import { displayDateTime } from '@/lib/presentation'
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
  const runAction = (row: Row, action: 'edit' | 'preview' | 'metrics') => {
    setBusy(true)
    setError('')
    void api
      .request<Row>(
        '/v1/admin/push/campaigns/' +
          row.id +
          (action === 'edit' ? '' : '/' + action),
      )
      .then((value) => (action === 'edit' ? setEdit(value) : setDetail(value)))
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Campaign request not confirmed.',
        ),
      )
      .finally(() => setBusy(false))
  }
  const cancel = (row: Row) => {
    if (
      !window.confirm(
        'Cancel future fanout? Already submitted notifications cannot be recalled.',
      )
    )
      return
    setBusy(true)
    setError('')
    void api
      .request('/v1/admin/push/campaigns/' + row.id + '/cancel', {
        method: 'POST',
        body: { expectedRevision: row.revision },
      })
      .then(refresh)
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Campaign cancellation not confirmed.',
        )
        r.reload()
      })
      .finally(() => setBusy(false))
  }
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="CUSTOMER COMMUNICATIONS"
        title="Rich messaging campaigns"
        description="Prepare, preview and review push campaigns using the current consent and approval workflow."
        action={
          <Button onClick={() => setEdit(null)}>Create campaign draft</Button>
        }
      />
      <AdminNotice title="Consent and approval boundaries" tone="warning">
        Marketing consent is required. Draft/edit and preview do not send. OWNER
        approval schedules fanout; provider acceptance is not device display.
        Only verified media and published canonical targets are allowed. Editing
        invalidates earlier approval.
      </AdminNotice>
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
      {detail !== null && (
        <Panel className="overflow-hidden">
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <SectionHeading
              title="Campaign response details"
              subtitle="Server-returned preview or metrics response"
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDetail(null)}
                >
                  Close details
                </Button>
              }
            />
          </div>
          <div className="p-4 sm:p-5">
            <DataView value={detail} />
          </div>
        </Panel>
      )}
      <ErrorMessage text={error} />
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Push campaign directory"
            subtitle={
              r.data
                ? `${r.data.total.toLocaleString('en-US')} server records · page ${r.data.page} of ${Math.max(1, r.data.pages)}`
                : 'Server-managed campaign drafts and schedules'
            }
            action={
              <Button
                size="sm"
                variant="secondary"
                busy={r.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={refresh}
              >
                Refresh campaigns
              </Button>
            }
          />
        </div>
        {r.data ? (
          r.data.items.length ? (
            <>
              <div
                className="table-scroll hidden lg:block"
                tabIndex={0}
                role="region"
                aria-label="Push campaigns"
              >
                <table className="admin-table min-w-[1050px]">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Audience</th>
                      <th>Target</th>
                      <th>Schedule</th>
                      <th>Revision</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.data.items.map((row) => (
                      <tr key={String(row.id)}>
                        <td className="min-w-52">
                          <p className="font-bold text-ink">
                            {String(row.title || row.id)}
                          </p>
                          <p className="mt-1 break-all text-[11px] font-normal text-muted">
                            {String(row.id)}
                          </p>
                        </td>
                        <td>
                          <Badge kind={statusKind(String(row.status || ''))}>
                            {String(row.status || 'Unknown')}
                          </Badge>
                        </td>
                        <td className="max-w-48 text-xs">
                          {String(row.audience || '—')}
                        </td>
                        <td className="text-xs">
                          {String(row.targetType || '—')}
                        </td>
                        <td className="min-w-44 text-xs text-muted">
                          {typeof row.scheduledAt === 'string'
                            ? displayDateTime(row.scheduledAt)
                            : 'Not scheduled'}
                        </td>
                        <td className="tabular-nums">
                          {String(row.revision ?? '—')}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy || row.status !== 'DRAFT'}
                              onClick={() => runAction(row, 'edit')}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => runAction(row, 'preview')}
                            >
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => runAction(row, 'metrics')}
                            >
                              Metrics
                            </Button>
                            {owner && row.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() => setApprove(row)}
                              >
                                Approve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={busy}
                              onClick={() => cancel(row)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 p-4 lg:hidden">
                {r.data.items.map((row) => (
                  <article
                    key={String(row.id)}
                    className="rounded-2xl border border-line bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-extrabold text-ink">
                          {String(row.title || row.id)}
                        </h3>
                        <p className="mt-1 break-all text-[11px] text-muted">
                          {String(row.id)}
                        </p>
                      </div>
                      <Badge kind={statusKind(String(row.status || ''))}>
                        {String(row.status || 'Unknown')}
                      </Badge>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-muted">Audience</dt>
                        <dd className="mt-1 break-words font-semibold text-ink">
                          {String(row.audience || '—')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Target</dt>
                        <dd className="mt-1 font-semibold text-ink">
                          {String(row.targetType || '—')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Schedule</dt>
                        <dd className="mt-1 font-semibold text-ink">
                          {typeof row.scheduledAt === 'string'
                            ? displayDateTime(row.scheduledAt)
                            : 'Not scheduled'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Revision</dt>
                        <dd className="mt-1 font-semibold tabular-nums text-ink">
                          {String(row.revision ?? '—')}
                        </dd>
                      </div>
                    </dl>
                    <details className="mt-3 border-t border-line pt-3">
                      <summary className="cursor-pointer text-xs font-bold text-primary">
                        View campaign record
                      </summary>
                      <div className="mt-3">
                        <DataView value={row} />
                      </div>
                    </details>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy || row.status !== 'DRAFT'}
                        onClick={() => runAction(row, 'edit')}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => runAction(row, 'preview')}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => runAction(row, 'metrics')}
                      >
                        Metrics
                      </Button>
                      {owner && row.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => setApprove(row)}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() => cancel(row)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
              <Pagination data={r.data} change={setPage} />
            </>
          ) : (
            <div className="p-4 sm:p-5">
              <AdminEmptyState
                title="No push campaigns found"
                description="Create a draft when you are ready to prepare a consent-aware campaign."
              />
            </div>
          )
        ) : (
          <div className="p-4 sm:p-5">
            <ResourceState error={r.error} retry={r.reload} variant="table" />
          </div>
        )}
      </Panel>
    </section>
  )
}
