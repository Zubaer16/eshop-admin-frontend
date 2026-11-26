'use client'
import { useEffect, useRef, useState } from 'react'
import { useNavigationRouter } from '@/components/layout/navigation-provider'
import { PageHeading } from '@/components/layout/page-heading'
import { api } from '@/lib/api/client'
import {
  enableBrowserPush,
  revokeBrowserPush,
  pushConfigured,
} from '@/lib/api/browser-push'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, SectionHeading } from '@/components/ui/panel'
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
} from '@/components/ui/admin-workspace'
import { displayDateTime } from '@/lib/presentation'
type Row = {
  id: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}
type Page = {
  items: Row[]
  total: number
  unread: number
  page: number
  pages: number
}
type Preferences = {
  revision: number
  securityEmailRequired: boolean
  transactionalInAppRequired: boolean
  [key: string]: number | boolean | string | null
}
const channels = [
  'transactionalEmail',
  'transactionalPush',
  'operationalInApp',
  'operationalEmail',
  'operationalPush',
  'marketingInApp',
  'marketingEmail',
  'marketingPush',
]
export function NotificationInbox() {
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const { session } = useAuth(),
    router = useNavigationRouter(),
    [page, setPage] = useState(1),
    [unread, setUnread] = useState(false),
    [data, setData] = useState<Page | null>(null),
    [prefs, setPrefs] = useState<Preferences | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false),
    [delivery, setDelivery] = useState<string | null>(null)
  useEffect(() => {
    setDelivery(new URLSearchParams(window.location.search).get('delivery'))
  }, [])
  useEffect(() => {
    let active = true
    const c = new AbortController()
    setData(null)
    setError('')
    void Promise.all([
      api.request<Page>('/v1/notifications', {
        query: { page, limit: 20, readState: unread ? 'unread' : 'all' },
        signal: c.signal,
      }),
      api.request<Preferences>('/v1/notifications/preferences', {
        signal: c.signal,
      }),
    ])
      .then(([rows, p]) => {
        if (active) {
          setData(rows)
          setPrefs(p)
        }
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
      c.abort()
    }
  }, [page, unread, revision])
  const epoch = session.epoch,
    subject = session.user?.id
  function guard() {
    const current = api.getSnapshot()
    if (
      !mounted.current ||
      current.epoch !== epoch ||
      current.user?.id !== subject
    )
      throw new Error('The account changed. Reopen inbox.')
  }
  async function action(work: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      guard()
      await work()
      guard()
      setRevision((v) => v + 1)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Action not confirmed. Refresh before retrying.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function open(id: string, push = false) {
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))
      throw new Error('Invalid notification identifier.')
    const target = await api.request<{ path: string; surface: string }>(
      push
        ? '/v1/notifications/push/deliveries/' + id + '/navigation'
        : '/v1/notifications/' + id + '/navigation',
    )
    guard()
    const expected = session.user?.role === 'CUSTOMER' ? 'STOREFRONT' : 'ADMIN'
    if (
      target.surface !== expected ||
      !/^\/(?!\/)[a-zA-Z0-9/_?=&%.-]*$/.test(target.path) ||
      /(?:\.\.|%2f|%5c|%25|\\)/i.test(target.path)
    )
      throw new Error('Notification destination is unavailable.')
    router.push(target.path)
  }
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="WORKSPACE COMMUNICATIONS"
        title="Notification inbox"
        description="Review account-owned in-app messages, notification preferences and this browser's push registration."
        action={
          <Button
            variant="secondary"
            busy={busy}
            pendingLabel="Refreshing…"
            onClick={() => setRevision((v) => v + 1)}
          >
            Refresh inbox
          </Button>
        }
      />
      <AdminNotice title="Notification and consent boundaries">
        Security email and transactional in-app history remain mandatory.
        Marketing consent is separate from browser notification permission.
        Browser push configuration and provider acceptance do not guarantee
        device display.
      </AdminNotice>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {delivery && (
        <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-extrabold text-ink">
              Received push notification
            </p>
            <p className="mt-1 break-all text-xs text-muted">
              Delivery reference: {delivery}
            </p>
          </div>
          <Button
            disabled={busy}
            onClick={() => void action(() => open(delivery, true))}
          >
            Open destination
          </Button>
        </Panel>
      )}
      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminMetricCard
              label="Unread messages"
              value={data.unread.toLocaleString('en-US')}
              detail="Server-reported unread count"
            />
            <AdminMetricCard
              label="Matching messages"
              value={data.total.toLocaleString('en-US')}
              detail={`Page ${data.page} of ${Math.max(1, data.pages)} · 20 records per page`}
            />
          </div>
          <Panel className="overflow-hidden">
            <div className="border-b border-line px-4 py-4 sm:px-5">
              <SectionHeading
                title="Inbox controls"
                subtitle="Choose which server messages to display."
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={unread}
                  onChange={(e) => {
                    setUnread(e.target.checked)
                    setPage(1)
                  }}
                />
                Unread only
              </label>
              <Button
                variant="secondary"
                disabled={busy}
                busy={busy}
                pendingLabel="Updating…"
                onClick={() =>
                  void action(async () => {
                    await api.request('/v1/notifications/read-all', {
                      method: 'PUT',
                      body: { before: new Date().toISOString() },
                    })
                    guard()
                    setNotice('Messages through the selected time marked read.')
                  })
                }
              >
                Mark current history read
              </Button>
            </div>
          </Panel>
          <Panel className="overflow-hidden">
            <div className="border-b border-line px-4 py-4 sm:px-5">
              <SectionHeading
                title="Messages"
                subtitle={`${data.items.length.toLocaleString('en-US')} messages on this page`}
              />
            </div>
            {data.items.length ? (
              <div className="grid gap-3 p-4 sm:p-5">
                {data.items.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-line bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-sm font-extrabold text-ink">
                          {row.title}
                        </h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                          {row.body}
                        </p>
                      </div>
                      <Badge kind={row.readAt ? 'neutral' : 'info'}>
                        {row.readAt ? 'Read' : 'Unread'}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                      <p className="text-xs text-muted">
                        Received {displayDateTime(row.createdAt)}
                        {row.readAt
                          ? ` · Read ${displayDateTime(row.readAt)}`
                          : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            void action(async () => {
                              await api.request(
                                '/v1/notifications/' + row.id + '/read',
                                { method: 'PUT', body: { read: !row.readAt } },
                              )
                            })
                          }
                        >
                          {row.readAt ? 'Mark unread' : 'Mark read'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void action(() => open(row.id))}
                        >
                          Open destination
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-4 sm:p-5">
                <AdminEmptyState
                  title="No messages in this view"
                  description={
                    unread
                      ? 'There are no unread messages in the current server result.'
                      : 'No messages were returned for this account.'
                  }
                />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 sm:px-5">
              <p className="text-xs font-semibold tabular-nums text-muted">
                Page {data.page} of {Math.max(1, data.pages)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || page <= 1}
                  onClick={() => setPage((v) => v - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || page >= data.pages}
                  onClick={() => setPage((v) => v + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Panel>
        </>
      ) : (
        <Panel className="p-4 sm:p-5">
          {error ? (
            <p className="text-sm text-muted">
              Inbox data is unavailable until the request succeeds.
            </p>
          ) : (
            <p role="status" className="text-sm text-muted">
              Loading inbox…
            </p>
          )}
        </Panel>
      )}
      {prefs && (
        <Panel className="overflow-hidden">
          <div className="border-b border-line px-4 py-4 sm:px-5">
            <SectionHeading
              title="Notification preferences"
              subtitle={`Current preference revision ${prefs.revision}. Required security and transactional channels remain mandatory.`}
            />
          </div>
          <form
            className="space-y-4 p-4 sm:p-5"
            onSubmit={(e) => {
              e.preventDefault()
              const form = new FormData(e.currentTarget)
              if (
                form.has('marketingEmail') ||
                form.has('marketingPush') ||
                form.has('marketingInApp')
              ) {
                if (
                  !window.confirm(
                    'Allow the selected marketing channels for this account?',
                  )
                )
                  return
              }
              void action(async () => {
                await api.request('/v1/notifications/preferences', {
                  method: 'PUT',
                  body: {
                    expectedRevision: prefs.revision,
                    ...Object.fromEntries(
                      channels.map((key) => [key, form.has(key)]),
                    ),
                  },
                })
                guard()
                setNotice('Notification preferences saved.')
              })
            }}
          >
            <fieldset
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              disabled={busy}
            >
              {channels.map((key) => (
                <label
                  key={key}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                >
                  <input
                    type="checkbox"
                    name={key}
                    defaultChecked={prefs[key] === true}
                  />
                  <span>{key.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
                </label>
              ))}
            </fieldset>
            <Button disabled={busy} busy={busy} pendingLabel="Saving…">
              Save notification preferences
            </Button>
          </form>
        </Panel>
      )}
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Browser push on this device"
            subtitle="Manage this browser's push registration independently from marketing consent."
            action={
              <Badge kind={pushConfigured() ? 'success' : 'warning'}>
                {pushConfigured() ? 'Configured' : 'Unavailable'}
              </Badge>
            }
          />
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <p className="text-sm leading-relaxed text-muted">
            {pushConfigured()
              ? 'Enable only if you want notifications on this browser.'
              : 'Browser push configuration is unavailable on this deployment. In-app messages remain available.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || !pushConfigured()}
              onClick={() =>
                void action(async () => {
                  await enableBrowserPush()
                  guard()
                  setNotice(
                    'This browser registration was confirmed. Provider delivery still depends on deployment configuration.',
                  )
                })
              }
            >
              Enable or refresh browser push
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  await revokeBrowserPush()
                  guard()
                  setNotice('This browser push registration was revoked.')
                })
              }
            >
              Revoke this browser push
            </Button>
          </div>
          <DeviceList revision={revision} />
        </div>
      </Panel>
    </section>
  )
}
function DeviceList({ revision }: { revision: number }) {
  const [rows, setRows] = useState<
      | {
          id: string
          surface: string
          status: string
          lastSeenAt: string
          expiresAt: string
        }[]
      | null
    >(null),
    [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setRows(null)
    setError('')
    void api
      .request<typeof rows>('/v1/notifications/push/devices')
      .then((value) => {
        if (active) setRows(value)
      })
      .catch((reason) => {
        if (active) setError(reason.message)
      })
    return () => {
      active = false
    }
  }, [revision])
  return (
    <div className="space-y-2 border-t border-line pt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-ink">Registered devices</h3>
        {rows && <Badge>{rows.length} devices</Badge>}
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          {error}
        </p>
      ) : rows ? (
        rows.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <article
                key={row.id}
                className="min-w-0 rounded-xl border border-line bg-white p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-extrabold text-ink">{row.surface}</p>
                  <Badge kind={statusKind(row.status)}>{row.status}</Badge>
                </div>
                <p className="mt-2 text-muted">
                  Last seen: {displayDateTime(row.lastSeenAt)}
                </p>
                <p className="mt-1 text-muted">
                  Expires: {displayDateTime(row.expiresAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            No registered push devices were returned.
          </p>
        )
      ) : (
        <p role="status" className="text-xs text-muted">
          Loading registered devices…
        </p>
      )}
    </div>
  )
}
