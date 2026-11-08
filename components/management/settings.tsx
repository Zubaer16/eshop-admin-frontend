'use client'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import {
  useResource,
  ResourceState,
  ErrorMessage,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { fieldClass } from '@/components/commerce/forms'
import { SpecForm, DataView, ReadPanel, PagedPanel, type Row } from './shared'
import type { formContracts } from '@/lib/api/management-contract'
const configs = [
  ['Profile', 'profile', 'PutStoreProfileDto'],
  ['SEO and policies', 'content', 'PutStoreContentDto'],
  ['Verified branding', 'branding', 'PutStoreBrandingDto'],
  ['Store presentation', 'operations', 'PutStoreOperationsDto'],
] as const
export function LiveSettings() {
  const [tab, setTab] = useState(0)
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Store settings</h1>
      <p className="text-sm text-muted">
        OWNER-only. Branding uses verified Media Library IDs. Presentation
        currency never converts product prices; order prefix is reserved and
        CORS remains deployment-owned. Policy and template fields are plain
        text.
      </p>
      <div className="flex flex-wrap gap-3">
        {configs.map(([name], i) => (
          <Button
            key={name}
            variant={tab === i ? 'primary' : 'secondary'}
            onClick={() => setTab(i)}
          >
            {name}
          </Button>
        ))}
      </div>
      <Config
        key={tab}
        route={'/v1/admin/store/' + configs[tab]![1]}
        contract={configs[tab]![2]}
      />
      <Templates kind="notifications" />
      <Templates kind="email" />
    </section>
  )
}
function Config({
  route,
  contract,
}: {
  route: string
  contract: keyof typeof formContracts
}) {
  const r = useResource<Row>(route)
  return r.data ? (
    <div className="space-y-4">
      <DataView value={r.data} />
      <SpecForm
        key={String(r.data.revision ?? r.data.updatedAt ?? 'new')}
        route={route}
        contract={contract}
        row={r.data}
        method="PUT"
        done={r.reload}
      />
    </div>
  ) : (
    <ResourceState error={r.error} retry={r.reload} />
  )
}
function Templates({ kind }: { kind: 'notifications' | 'email' }) {
  const r = useResource<Row[]>('/v1/admin/' + kind + '/templates'),
    [edit, setEdit] = useState<Row | null>(null)
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">
        {kind === 'email' ? 'Email templates' : 'In-app templates'}
      </h2>
      {edit && (
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
      )}
      {r.data ? (
        r.data.map((row) => (
          <article
            key={String(row.key)}
            className="space-y-3 rounded-xl border bg-white p-4"
          >
            <DataView value={row} />
            <Button variant="secondary" onClick={() => setEdit(row)}>
              Edit {String(row.key)} template
            </Button>
          </article>
        ))
      ) : (
        <ResourceState error={r.error} retry={r.reload} />
      )}
    </section>
  )
}
export function LiveOperations() {
  const [receipt, setReceipt] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false)
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-black">Operations</h1>
      <p className="text-sm text-muted">
        Current counts are not throughput or delivery proof. SMTP ACCEPTED and
        FCM acceptance are submissions only. Uncertain provider/payment jobs
        require operator reconciliation.
      </p>
      <ReadPanel title="Scheduler status" route="/v1/admin/jobs/status" />
      <ReadPanel
        title="Recent scheduler runs"
        route="/v1/admin/jobs/runs"
        query={{ limit: 50 }}
      />
      <ReadPanel title="Operational failures" route="/v1/admin/jobs/failures" />
      <form
        className="space-y-4 rounded-xl border bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (busy) return
          if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(receipt)) {
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
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false))
        }}
      >
        <label className="block text-sm font-bold">
          Exhausted in-app receipt UUID
          <input
            className={fieldClass}
            value={receipt}
            onChange={(e) => setReceipt(e.target.value.trim())}
            required
          />
        </label>
        <ErrorMessage text={error} />
        {notice && <p role="status">{notice}</p>}
        <Button disabled={busy}>Queue safe in-app retry</Button>
      </form>
      <ReadPanel
        title="In-app planning failures"
        route="/v1/admin/notifications/failures"
      />
      <ReadPanel title="Email readiness" route="/v1/admin/email/status" />
      <PagedPanel
        title="Email submissions"
        route="/v1/admin/email/deliveries"
      />
      <ReadPanel
        title="Email planning failures"
        route="/v1/admin/email/planning-failures"
      />
      <ReadPanel title="Push readiness" route="/v1/admin/push/status" />
      <PagedPanel title="Push submissions" route="/v1/admin/push/deliveries" />
      <ReadPanel
        title="Push planning failures"
        route="/v1/admin/push/planning-failures"
      />
    </section>
  )
}
