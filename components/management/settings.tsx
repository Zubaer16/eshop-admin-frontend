'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import {
  useResource,
  ResourceState,
  ErrorMessage,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/components/commerce/forms'
import { Panel, SectionHeading } from '@/components/ui/panel'
import {
  AdminEmptyState,
  AdminNotice,
  AdminTabs,
} from '@/components/ui/admin-workspace'
import { SpecForm, DataView, ReadPanel, PagedPanel, type Row } from './shared'
import type { formContracts } from '@/lib/api/management-contract'
const configs = [
  ['Profile', 'profile', 'PutStoreProfileDto'],
  ['SEO and policies', 'content', 'PutStoreContentDto'],
  ['Verified branding', 'branding', 'PutStoreBrandingDto'],
  ['Store presentation', 'operations', 'PutStoreOperationsDto'],
] as const
export function Settings() {
  const [tab, setTab] = useState(0)
  const active = configs[tab]!
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="STORE CONFIGURATION"
        title="Store settings"
        description="Manage the store profile, policies, verified brand assets and storefront presentation settings."
      />
      <AdminNotice title="Configuration boundaries" tone="warning">
        OWNER-only. Branding uses verified Media Library IDs. Presentation
        currency never converts product prices; order prefix is reserved and
        CORS remains deployment-owned. Policy and template fields are plain
        text.
      </AdminNotice>
      <Panel className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-ink">
              Configuration area
            </p>
            <p className="mt-1 text-xs text-muted">
              Choose a store configuration group.
            </p>
          </div>
          <AdminTabs
            label="Store configuration"
            value={active[1]}
            onChange={(value) =>
              setTab(
                Math.max(
                  0,
                  configs.findIndex((item) => item[1] === value),
                ),
              )
            }
            items={configs.map(([name, key]) => ({ value: key, label: name }))}
          />
        </div>
      </Panel>
      <Config
        key={tab}
        route={'/v1/admin/store/' + active[1]}
        contract={active[2]}
        title={active[0]}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Templates kind="notifications" />
        <Templates kind="email" />
      </div>
    </section>
  )
}
function Config({
  route,
  contract,
  title,
}: {
  route: string
  contract: keyof typeof formContracts
  title: string
}) {
  const r = useResource<Row>(route)
  return r.data ? (
    <Panel className="overflow-hidden">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <SectionHeading
          title={title}
          subtitle="Current server configuration and revision-aware editor."
          action={
            <Button
              size="sm"
              variant="secondary"
              busy={r.isRefreshing}
              pendingLabel="Refreshing…"
              onClick={r.reload}
            >
              Refresh values
            </Button>
          }
        />
      </div>
      <div className="space-y-5 p-4 sm:p-5">
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.12em] text-muted">
            Current server values
          </p>
          <DataView value={r.data} />
        </div>
        <div className="border-t border-line pt-5">
          <SpecForm
            key={String(r.data.revision ?? r.data.updatedAt ?? 'new')}
            route={route}
            contract={contract}
            row={r.data}
            method="PUT"
            done={r.reload}
            title={`Save ${title.toLowerCase()}`}
          />
        </div>
      </div>
    </Panel>
  ) : (
    <ResourceState error={r.error} retry={r.reload} variant="form" />
  )
}
function Templates({ kind }: { kind: 'notifications' | 'email' }) {
  const r = useResource<Row[]>('/v1/admin/' + kind + '/templates'),
    [edit, setEdit] = useState<Row | null>(null)
  const title = kind === 'email' ? 'Email templates' : 'In-app templates'
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <SectionHeading
          title={title}
          subtitle="Edit the current server template revision."
          action={
            <Button
              size="sm"
              variant="secondary"
              busy={r.isRefreshing}
              pendingLabel="Refreshing…"
              onClick={r.reload}
            >
              Refresh
            </Button>
          }
        />
      </div>
      {edit && (
        <div className="border-b border-line bg-blue-50/30 p-4 sm:p-5">
          <SpecForm
            key={String(edit.key) + ':' + String(edit.revision)}
            contract={
              kind === 'email'
                ? 'SaveEmailTemplateDto'
                : 'SaveNotificationTemplateDto'
            }
            route={'/v1/admin/' + kind + '/templates/' + edit.key}
            row={edit}
            method="PUT"
            done={() => {
              setEdit(null)
              r.reload()
            }}
            title="Save template revision"
          />
        </div>
      )}
      {r.data ? (
        r.data.length ? (
          <div className="grid gap-3 p-4 sm:p-5">
            {r.data.map((row) => (
              <article
                key={String(row.key)}
                className="min-w-0 rounded-2xl border border-line bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-extrabold text-ink">
                      {String(row.key)}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      Revision {String(row.revision ?? '—')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEdit(row)}
                  >
                    Edit template
                  </Button>
                </div>
                <details className="mt-3 border-t border-line pt-3">
                  <summary className="cursor-pointer text-xs font-bold text-primary">
                    View template fields
                  </summary>
                  <div className="mt-3">
                    <DataView value={row} />
                  </div>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <AdminEmptyState title={`No ${kind} templates returned`} />
          </div>
        )
      ) : (
        <div className="p-4 sm:p-5">
          <ResourceState error={r.error} retry={r.reload} variant="grid" />
        </div>
      )}
    </Panel>
  )
}
export function Operations() {
  const [receipt, setReceipt] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false)
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="SYSTEM HEALTH & JOBS"
        title="Operations"
        description="Inspect scheduler activity, delivery readiness and operational failures without replaying uncertain provider work."
      />
      <AdminNotice title="Operational evidence boundaries" tone="warning">
        Current counts are not throughput or delivery proof. SMTP ACCEPTED and
        FCM acceptance are submissions only. Uncertain provider/payment jobs
        require operator reconciliation.
      </AdminNotice>
      <div className="grid gap-5 xl:grid-cols-2">
        <ReadPanel title="Scheduler status" route="/v1/admin/jobs/status" />
        <ReadPanel
          title="Recent scheduler runs"
          route="/v1/admin/jobs/runs"
          query={{ limit: 50 }}
        />
        <ReadPanel
          title="Operational failures"
          route="/v1/admin/jobs/failures"
        />
        <ReadPanel
          title="In-app planning failures"
          route="/v1/admin/notifications/failures"
        />
        <ReadPanel title="Email readiness" route="/v1/admin/email/status" />
        <ReadPanel
          title="Email planning failures"
          route="/v1/admin/email/planning-failures"
        />
        <ReadPanel title="Push readiness" route="/v1/admin/push/status" />
        <ReadPanel
          title="Push planning failures"
          route="/v1/admin/push/planning-failures"
        />
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Safe in-app receipt retry"
            subtitle="Only exhausted DB-only in-app receipts are eligible for this action."
          />
        </div>
        <form
          className="space-y-4 p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (busy) return
            if (
              !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(receipt)
            ) {
              setError('Enter a canonical exhausted in-app receipt UUID.')
              return
            }
            if (
              !window.confirm(
                'Queue only this exhausted DB-only in-app receipt for safe retry? No provider submissions are replayed.',
              )
            )
              return
            setBusy(true)
            setError('')
            setNotice('')
            void api
              .request('/v1/admin/jobs/retry-notification/' + receipt, {
                method: 'POST',
              })
              .then(() =>
                setNotice(
                  'Receipt queued for safe DB-only retry. Refresh failures.',
                ),
              )
              .catch((reason) =>
                setError(
                  reason instanceof Error
                    ? reason.message
                    : 'Retry request not confirmed.',
                ),
              )
              .finally(() => setBusy(false))
          }}
        >
          <label className="block text-xs font-bold text-muted">
            Exhausted in-app receipt UUID
            <input
              className={fieldClass}
              value={receipt}
              onChange={(e) => setReceipt(e.target.value.trim())}
              required
            />
          </label>
          <ErrorMessage text={error} />
          {notice && (
            <p
              role="status"
              className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {notice}
            </p>
          )}
          <Button disabled={busy} busy={busy} pendingLabel="Queueing…">
            Queue safe in-app retry
          </Button>
        </form>
      </Panel>
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Delivery submissions"
            subtitle="Submission records are not proof of device display or recipient delivery."
          />
        </div>
        <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-2">
          <PagedPanel
            title="Email submissions"
            route="/v1/admin/email/deliveries"
          />
          <PagedPanel
            title="Push submissions"
            route="/v1/admin/push/deliveries"
          />
        </div>
      </Panel>
    </section>
  )
}
