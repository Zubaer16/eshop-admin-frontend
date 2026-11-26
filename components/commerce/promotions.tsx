'use client'

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  Info,
  Megaphone,
  RefreshCw,
  Search,
  Tag,
  TicketPercent,
  X,
} from 'lucide-react'
import { PageHeading } from '@/components/layout/page-heading'
import { api, ApiRequestError } from '@/lib/api/client'
import type { Page } from '@/lib/api/catalog'
import {
  useResource,
  ResourceState,
  ErrorMessage,
  message,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { Badge, statusKind } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/panel'
import { prefetchAdminPromotionCampaigns } from '@/lib/admin-cache'
import { createIntentPrefetch } from '@/lib/intent-prefetch'
import { displayDateTime, formatMinor } from '@/lib/presentation'
import {
  formatBasisPoints,
  fromUtcDateTimeInput,
  shortPromotionId,
  toUtcDateTimeInput,
} from '@/lib/promotion-presentation'

type Campaign = {
  id: string
  revision: number
  title: string
  slug: string
  description: string
  status: string
  startsAt: string | null
  endsAt: string | null
}
type Coupon = {
  id: string
  revision: number
  code: string
  kind: 'PERCENT' | 'FIXED'
  value: number
  currency: string
  minimumSubtotalMinor: number
  maximumDiscountMinor: number | null
  usageLimit: number | null
  perCustomerLimit: number | null
  startsAt: string | null
  endsAt: string | null
  categoryId: string | null
  campaignId: string | null
  enabled: boolean
}
type PromotionRow = Coupon | Campaign

type UsageResult = {
  id: string
  activeClaims: number
  note: string
}

const isCoupon = (row: PromotionRow): row is Coupon => 'code' in row

export function Promotions() {
  const [tab, setTab] = useState<'coupons' | 'campaigns'>('coupons')
  const campaignPrefetchIntent = useMemo(() => createIntentPrefetch(300), [])
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next =
      event.key === 'Home' || (event.key === 'ArrowLeft' && tab === 'campaigns')
        ? 'coupons'
        : event.key === 'End' ||
            (event.key === 'ArrowRight' && tab === 'coupons')
          ? 'campaigns'
          : tab
    setTab(next)
    document.getElementById(`promotions-${next}-tab`)?.focus()
  }
  useEffect(
    () => () => campaignPrefetchIntent.cancelAll(),
    [campaignPrefetchIntent],
  )

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="SALES & MERCHANDISING"
        title="Promotions"
        description="Manage checkout coupon rules and editorial campaign schedules from one workspace."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <TicketPercent size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink">Coupon rules</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              One coupon code per checkout. Discounts use the exact currency
              lane and do not stack.
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
            <Megaphone size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink">
              Editorial campaigns
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Campaign schedules are editorial only. They do not automatically
              change prices or send messages.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div
          role="tablist"
          aria-label="Promotion type"
          className="inline-flex w-full flex-wrap gap-1 rounded-2xl border border-line bg-slate-100/80 p-1 sm:w-auto"
        >
          <button
            id="promotions-coupons-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'coupons'}
            aria-controls="promotions-panel"
            tabIndex={tab === 'coupons' ? 0 : -1}
            onKeyDown={handleTabKeyDown}
            onClick={() => setTab('coupons')}
            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition sm:flex-none ${tab === 'coupons' ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/80' : 'text-slate-600 hover:bg-white/70 hover:text-ink'}`}
          >
            <TicketPercent size={16} aria-hidden="true" />
            Coupons
          </button>
          <button
            id="promotions-campaigns-tab"
            type="button"
            role="tab"
            aria-selected={tab === 'campaigns'}
            aria-controls="promotions-panel"
            tabIndex={tab === 'campaigns' ? 0 : -1}
            onKeyDown={handleTabKeyDown}
            onMouseEnter={() =>
              campaignPrefetchIntent.schedule(
                'campaigns',
                prefetchAdminPromotionCampaigns,
              )
            }
            onMouseLeave={() => campaignPrefetchIntent.cancel('campaigns')}
            onFocus={() =>
              campaignPrefetchIntent.run(
                'campaigns',
                prefetchAdminPromotionCampaigns,
              )
            }
            onTouchStart={() =>
              campaignPrefetchIntent.run(
                'campaigns',
                prefetchAdminPromotionCampaigns,
              )
            }
            onClick={() => {
              campaignPrefetchIntent.cancel('campaigns')
              setTab('campaigns')
            }}
            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition sm:flex-none ${tab === 'campaigns' ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/80' : 'text-slate-600 hover:bg-white/70 hover:text-ink'}`}
          >
            <Megaphone size={16} aria-hidden="true" />
            Campaigns
          </button>
        </div>

        <div
          id="promotions-panel"
          role="tabpanel"
          aria-labelledby={`promotions-${tab}-tab`}
        >
          <PromotionList key={tab} kind={tab} />
        </div>
      </div>
    </section>
  )
}

function PromotionList({ kind }: { kind: 'coupons' | 'campaigns' }) {
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PromotionRow | null | undefined>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [usage, setUsage] = useState<UsageResult | null>(null)
  const route = '/v1/admin/promotions/' + kind
  const list = useResource<Page<PromotionRow>>(route, {
    page,
    limit: 20,
    search: search || undefined,
  })
  // Keep one stable snapshot so TypeScript retains the null check inside JSX callbacks.
  const pageData = list.data

  const refresh = (messageText?: string) => {
    setSelected(undefined)
    setUsage(null)
    setError('')
    setNotice(messageText || '')
    list.reload()
  }
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearch(draft.trim())
    setPage(1)
  }
  const openRecord = (id: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    void api
      .request<PromotionRow>(route + '/' + id)
      .then(setSelected)
      .catch((reason) => setError(message(reason)))
      .finally(() => setBusy(false))
  }
  const readUsage = (row: Coupon) => {
    setBusy(true)
    setError('')
    setNotice('')
    void api
      .request<{ activeClaims: number; note: string }>(
        route + '/' + row.id + '/usage',
      )
      .then((value) => setUsage({ id: row.id, ...value }))
      .catch((reason) => setError(message(reason)))
      .finally(() => setBusy(false))
  }
  const pauseRecord = (row: PromotionRow) => {
    const action =
      kind === 'coupons' ? 'disable this coupon' : 'pause this campaign'
    if (
      !window.confirm(
        `Are you sure you want to ${action}? Existing history and holds are preserved.`,
      )
    )
      return
    setBusy(true)
    setError('')
    setNotice('')
    void api
      .request(route + '/' + row.id, {
        method: 'DELETE',
        query: { expectedRevision: row.revision },
      })
      .then(() =>
        refresh(kind === 'coupons' ? 'Coupon disabled.' : 'Campaign paused.'),
      )
      .catch((reason) => {
        setError(message(reason))
        list.reload()
      })
      .finally(() => setBusy(false))
  }

  const countLabel = pageData
    ? `${pageData.total.toLocaleString('en-US')} matching ${kind}`
    : `Manage ${kind}`

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_24px_rgba(15,23,42,.035)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-ink">
            {kind === 'coupons' ? 'Coupon directory' : 'Campaign directory'}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {countLabel} · 20 records per page
          </p>
        </div>
        <Button
          onClick={() => {
            setSelected(null)
            setError('')
            setNotice('')
            setUsage(null)
          }}
        >
          <Tag size={16} aria-hidden="true" />
          Create {kind === 'coupons' ? 'coupon' : 'campaign'}
        </Button>
      </div>

      <form
        onSubmit={submitSearch}
        role="search"
        aria-label={`Search ${kind}`}
        className="grid gap-3 border-b border-line bg-slate-50/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end sm:px-5"
      >
        <label className="min-w-0 text-xs font-bold text-muted">
          Search {kind}
          <span className="relative mt-2 block">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 text-slate-400"
            />
            <input
              aria-label={`Search ${kind}`}
              className="h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm font-medium text-ink outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-blue-100"
              value={draft}
              maxLength={80}
              placeholder={
                kind === 'coupons'
                  ? 'Search coupon code'
                  : 'Search campaign title'
              }
              onChange={(event) => setDraft(event.target.value)}
            />
          </span>
        </label>
        <Button type="submit" size="md">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDraft('')
              setSearch('')
              setPage(1)
            }}
          >
            Clear search
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          busy={list.isRefreshing}
          pendingLabel="Refreshing…"
          onClick={() => refresh()}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Refresh
        </Button>
      </form>

      <div className="space-y-3 px-4 pt-3 sm:px-5">
        <ErrorMessage text={error} />
        <ErrorMessage text={list.error && pageData ? list.error : ''} />
        {notice && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {notice}
          </p>
        )}
        {usage && (
          <div
            role="status"
            className="rounded-xl border border-blue-100 bg-blue-50/70 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-ink">
                Active quota claims
              </p>
              <Badge kind="info">Server response</Badge>
            </div>
            <p className="mt-2 text-2xl font-black tabular-nums text-primary">
              {usage.activeClaims.toLocaleString('en-US')}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {usage.note}
            </p>
            <p className="mt-2 text-[11px] text-muted">
              Coupon reference: {shortPromotionId(usage.id)}
            </p>
          </div>
        )}
      </div>

      {selected !== undefined && (
        <div className="border-b border-line bg-slate-50/60 p-4 sm:p-5">
          {kind === 'coupons' ? (
            <CouponForm
              key={(selected?.id || 'new') + ':' + (selected?.revision || 0)}
              row={selected as Coupon | null}
              cancel={() => setSelected(undefined)}
              saved={() => refresh('Coupon saved.')}
              reconcile={() => refresh()}
            />
          ) : (
            <CampaignForm
              key={(selected?.id || 'new') + ':' + (selected?.revision || 0)}
              row={selected as Campaign | null}
              cancel={() => setSelected(undefined)}
              saved={() => refresh('Campaign saved.')}
              reconcile={() => refresh()}
            />
          )}
        </div>
      )}

      {pageData ? (
        <>
          {kind === 'coupons' ? (
            <CouponDirectory
              rows={pageData.items.filter(isCoupon)}
              busy={busy}
              edit={openRecord}
              usage={readUsage}
              disable={pauseRecord}
              emptySearch={Boolean(search)}
              clearSearch={() => {
                setDraft('')
                setSearch('')
                setPage(1)
              }}
              create={() => setSelected(null)}
            />
          ) : (
            <CampaignDirectory
              rows={pageData.items.filter(
                (row): row is Campaign => !isCoupon(row),
              )}
              busy={busy}
              edit={openRecord}
              pause={pauseRecord}
              emptySearch={Boolean(search)}
              clearSearch={() => {
                setDraft('')
                setSearch('')
                setPage(1)
              }}
              create={() => setSelected(null)}
            />
          )}
          {pageData.items.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 sm:px-5">
              <p className="text-xs font-medium tabular-nums text-muted">
                Showing{' '}
                {Math.min(
                  (pageData.page - 1) * pageData.limit + 1,
                  pageData.total,
                ).toLocaleString('en-US')}
                –
                {Math.min(
                  pageData.page * pageData.limit,
                  pageData.total,
                ).toLocaleString('en-US')}{' '}
                of {pageData.total.toLocaleString('en-US')}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pageData.page <= 1}
                  onClick={() => setPage(pageData.page - 1)}
                >
                  Previous
                </Button>
                <span className="min-w-20 text-center text-xs font-bold tabular-nums text-ink">
                  {pageData.page} / {Math.max(1, pageData.pages)}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pageData.page >= pageData.pages}
                  onClick={() => setPage(pageData.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 sm:p-5">
          <ResourceState
            error={list.error}
            retry={list.reload}
            variant="table"
          />
        </div>
      )}
    </section>
  )
}

function CouponDirectory({
  rows,
  busy,
  edit,
  usage,
  disable,
  emptySearch,
  clearSearch,
  create,
}: {
  rows: Coupon[]
  busy: boolean
  edit: (id: string) => void
  usage: (row: Coupon) => void
  disable: (row: Coupon) => void
  emptySearch: boolean
  clearSearch: () => void
  create: () => void
}) {
  if (!rows.length)
    return (
      <EmptyPromotionState
        title={emptySearch ? 'No matching coupons' : 'No coupons created yet'}
        description={
          emptySearch
            ? 'Try another coupon code or clear the search.'
            : 'Create a coupon to define an eligible checkout discount.'
        }
        actionLabel={emptySearch ? 'Clear search' : 'Create coupon'}
        action={emptySearch ? clearSearch : create}
      />
    )

  return (
    <>
      <div
        className="table-scroll hidden md:block"
        role="region"
        tabIndex={0}
        aria-label="Coupons table"
        data-testid="promotion-table"
      >
        <table className="admin-table min-w-[1120px]">
          <thead>
            <tr>
              <th>Coupon</th>
              <th>Discount</th>
              <th>Eligibility</th>
              <th>Usage limits</th>
              <th>Validity window (UTC)</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <PromotionIdentity
                    title={row.code}
                    id={row.id}
                    revision={row.revision}
                    icon="coupon"
                  />
                </td>
                <td>
                  <p className="whitespace-nowrap text-sm font-extrabold text-ink">
                    {discountLabel(row)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {row.kind === 'PERCENT' ? 'Percentage' : 'Fixed amount'} ·{' '}
                    {row.currency}
                  </p>
                </td>
                <td>
                  <p className="whitespace-nowrap text-xs font-semibold text-ink">
                    Min. {formatMinor(row.minimumSubtotalMinor, row.currency)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {row.maximumDiscountMinor === null
                      ? 'No discount cap'
                      : `Cap ${formatMinor(row.maximumDiscountMinor, row.currency)}`}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {row.categoryId ? 'Exact category only' : 'All categories'}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {row.campaignId ? 'Campaign gated' : 'No campaign gate'}
                  </p>
                </td>
                <td>
                  <p className="text-xs font-semibold text-ink">
                    {row.usageLimit === null
                      ? 'Unlimited total'
                      : `${row.usageLimit.toLocaleString('en-US')} total`}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {row.perCustomerLimit === null
                      ? 'Unlimited per customer'
                      : `${row.perCustomerLimit.toLocaleString('en-US')} per customer`}
                  </p>
                </td>
                <td>
                  <PromotionWindow
                    startsAt={row.startsAt}
                    endsAt={row.endsAt}
                  />
                </td>
                <td>
                  <Badge
                    kind={statusKind(row.enabled ? 'ENABLED' : 'DISABLED')}
                  >
                    {row.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </td>
                <td>
                  <PromotionActions
                    busy={busy}
                    edit={() => edit(row.id)}
                    usage={() => usage(row)}
                    disable={() => disable(row)}
                    disableLabel="Disable"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="space-y-3 p-4 md:hidden"
        aria-label="Coupons list"
        data-testid="promotion-cards"
      >
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <PromotionIdentity
                title={row.code}
                id={row.id}
                revision={row.revision}
                icon="coupon"
              />
              <Badge kind={statusKind(row.enabled ? 'ENABLED' : 'DISABLED')}>
                {row.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  Discount
                </p>
                <p className="mt-1 text-lg font-black text-ink">
                  {discountLabel(row)}
                </p>
                <p className="text-[11px] text-muted">
                  {row.kind === 'PERCENT' ? 'Percentage' : 'Fixed amount'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  Minimum subtotal
                </p>
                <p className="mt-1 text-lg font-black text-ink">
                  {formatMinor(row.minimumSubtotalMinor, row.currency)}
                </p>
                <p className="text-[11px] text-muted">{row.currency}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <LimitValue
                label="Total limit"
                value={
                  row.usageLimit === null
                    ? 'Unlimited'
                    : row.usageLimit.toLocaleString('en-US')
                }
              />
              <LimitValue
                label="Per customer"
                value={
                  row.perCustomerLimit === null
                    ? 'Unlimited'
                    : row.perCustomerLimit.toLocaleString('en-US')
                }
              />
              <LimitValue
                label="Discount cap"
                value={
                  row.maximumDiscountMinor === null
                    ? 'None'
                    : formatMinor(row.maximumDiscountMinor, row.currency)
                }
              />
              <LimitValue
                label="Category"
                value={
                  row.categoryId ? 'Exact category only' : 'All categories'
                }
              />
              <LimitValue
                label="Campaign gate"
                value={row.campaignId ? 'Required' : 'None'}
              />
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <PromotionWindow startsAt={row.startsAt} endsAt={row.endsAt} />
            </div>
            <div className="mt-3">
              <PromotionActions
                busy={busy}
                edit={() => edit(row.id)}
                usage={() => usage(row)}
                disable={() => disable(row)}
                disableLabel="Disable"
              />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function CampaignDirectory({
  rows,
  busy,
  edit,
  pause,
  emptySearch,
  clearSearch,
  create,
}: {
  rows: Campaign[]
  busy: boolean
  edit: (id: string) => void
  pause: (row: Campaign) => void
  emptySearch: boolean
  clearSearch: () => void
  create: () => void
}) {
  if (!rows.length)
    return (
      <EmptyPromotionState
        title={
          emptySearch ? 'No matching campaigns' : 'No campaigns created yet'
        }
        description={
          emptySearch
            ? 'Try another title or slug, or clear the search.'
            : 'Create an editorial campaign to manage its status and schedule.'
        }
        actionLabel={emptySearch ? 'Clear search' : 'Create campaign'}
        action={emptySearch ? clearSearch : create}
      />
    )

  return (
    <>
      <div
        className="table-scroll hidden md:block"
        role="region"
        tabIndex={0}
        aria-label="Campaigns table"
        data-testid="promotion-table"
      >
        <table className="admin-table min-w-[980px]">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Schedule (UTC)</th>
              <th>Internal notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <PromotionIdentity
                    title={row.title}
                    id={row.id}
                    revision={row.revision}
                    icon="campaign"
                    secondary={`/${row.slug}`}
                  />
                </td>
                <td>
                  <Badge kind={campaignStatusKind(row.status)}>
                    {row.status.replaceAll('_', ' ')}
                  </Badge>
                </td>
                <td>
                  <PromotionWindow
                    startsAt={row.startsAt}
                    endsAt={row.endsAt}
                  />
                </td>
                <td>
                  <p className="max-w-[280px] whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                    {row.description || 'No internal notes'}
                  </p>
                </td>
                <td>
                  <PromotionActions
                    busy={busy}
                    edit={() => edit(row.id)}
                    disable={() => pause(row)}
                    disableLabel="Pause"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="space-y-3 p-4 md:hidden"
        aria-label="Campaigns list"
        data-testid="promotion-cards"
      >
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <PromotionIdentity
                title={row.title}
                id={row.id}
                revision={row.revision}
                icon="campaign"
                secondary={`/${row.slug}`}
              />
              <Badge kind={campaignStatusKind(row.status)}>
                {row.status.replaceAll('_', ' ')}
              </Badge>
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <PromotionWindow startsAt={row.startsAt} endsAt={row.endsAt} />
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
              {row.description || 'No internal notes'}
            </p>
            <div className="mt-3 border-t border-line pt-3">
              <PromotionActions
                busy={busy}
                edit={() => edit(row.id)}
                disable={() => pause(row)}
                disableLabel="Pause"
              />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function campaignStatusKind(status: string) {
  if (status === 'SCHEDULED') return 'info' as const
  if (status === 'PAUSED') return 'warning' as const
  return statusKind(status)
}

function discountLabel(row: Coupon) {
  return row.kind === 'PERCENT'
    ? formatBasisPoints(row.value)
    : formatMinor(row.value, row.currency)
}

function PromotionIdentity({
  title,
  id,
  revision,
  icon,
  secondary,
}: {
  title: string
  id: string
  revision: number
  icon: 'coupon' | 'campaign'
  secondary?: string
}) {
  const [copied, setCopied] = useState(false)
  const copyReference = () => {
    if (!navigator.clipboard?.writeText) return
    void navigator.clipboard
      .writeText(id)
      .then(() => setCopied(true))
      .catch(() => setCopied(false))
  }
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
        {icon === 'coupon' ? (
          <TicketPercent size={18} aria-hidden="true" />
        ) : (
          <Megaphone size={18} aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0">
        <p className="break-words text-sm font-extrabold text-ink">{title}</p>
        <div className="mt-1 flex min-w-0 items-center gap-1">
          <p
            className="truncate text-[11px] text-muted"
            title={secondary || id}
          >
            {secondary || `Ref ${shortPromotionId(id)}`} · Rev {revision}
          </p>
          <button
            type="button"
            onClick={copyReference}
            title={id}
            aria-label={`Copy full promotion reference ${id}`}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            {copied ? (
              <Check size={13} aria-hidden="true" />
            ) : (
              <Copy size={13} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function PromotionWindow({
  startsAt,
  endsAt,
}: {
  startsAt: string | null
  endsAt: string | null
}) {
  return (
    <div className="min-w-[180px] space-y-1.5 text-xs">
      <div className="flex items-start gap-2">
        <CalendarClock
          size={14}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-muted"
        />
        <div>
          <p className="font-semibold text-ink">
            {startsAt ? displayDateTime(startsAt) : 'No start limit'}
          </p>
          <p className="text-[10px] text-muted">Start inclusive · UTC</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Clock3
          size={14}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-muted"
        />
        <div>
          <p className="font-semibold text-ink">
            {endsAt ? displayDateTime(endsAt) : 'No end limit'}
          </p>
          <p className="text-[10px] text-muted">End exclusive · UTC</p>
        </div>
      </div>
    </div>
  )
}

function LimitValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-ink">{value}</p>
    </div>
  )
}

function PromotionActions({
  busy,
  edit,
  usage,
  disable,
  disableLabel,
}: {
  busy: boolean
  edit: () => void
  usage?: () => void
  disable: () => void
  disableLabel: 'Disable' | 'Pause'
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={edit}
      >
        <Edit3 size={14} aria-hidden="true" /> Edit
      </Button>
      {usage && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={usage}
        >
          <Info size={14} aria-hidden="true" /> Quota
        </Button>
      )}
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={busy}
        onClick={disable}
      >
        {disableLabel}
      </Button>
    </div>
  )
}

function EmptyPromotionState({
  title,
  description,
  actionLabel,
  action,
}: {
  title: string
  description: string
  actionLabel: string
  action: () => void
}) {
  return (
    <div className="p-8 sm:p-12">
      <EmptyState title={title} description={description} />
      <div className="-mt-5 flex justify-center">
        <Button type="button" variant="secondary" onClick={action}>
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-line pb-3">
        <h3 className="text-sm font-extrabold text-ink">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
      {children}
    </section>
  )
}

function PromotionField({
  name,
  label,
  value = '',
  type = 'text',
  required = false,
  min,
  helper,
  placeholder,
  maxLength,
  minLength,
  pattern,
}: {
  name: string
  label: string
  value?: string | number
  type?: string
  required?: boolean
  min?: number
  helper?: string
  placeholder?: string
  maxLength?: number
  minLength?: number
  pattern?: string
}) {
  return (
    <label className="block min-w-0 text-xs font-bold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value}
        min={min}
        step={
          type === 'number' ? 1 : type === 'datetime-local' ? 'any' : undefined
        }
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        autoComplete="off"
        className="mt-2 block h-11 w-full min-w-0 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-blue-100"
      />
      {helper && (
        <span className="mt-1.5 block text-[11px] font-normal leading-5 text-muted">
          {helper}
        </span>
      )}
    </label>
  )
}

function PromotionSelect({
  name,
  label,
  defaultValue,
  options,
  helper,
}: {
  name: string
  label: string
  defaultValue: string
  options: { value: string; label: string }[]
  helper?: string
}) {
  return (
    <label className="block min-w-0 text-xs font-bold text-slate-700">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 block h-11 w-full min-w-0 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper && (
        <span className="mt-1.5 block text-[11px] font-normal leading-5 text-muted">
          {helper}
        </span>
      )}
    </label>
  )
}

function PromotionTextArea({
  name,
  label,
  value,
  helper,
  maxLength,
}: {
  name: string
  label: string
  value: string
  helper: string
  maxLength: number
}) {
  return (
    <label className="block min-w-0 text-xs font-bold text-slate-700">
      {label}
      <textarea
        name={name}
        defaultValue={value}
        maxLength={maxLength}
        rows={4}
        className="mt-2 block min-h-28 w-full min-w-0 resize-y rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none transition placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-blue-100"
      />
      <span className="mt-1.5 block text-[11px] font-normal leading-5 text-muted">
        {helper}
      </span>
    </label>
  )
}

function PromotionCheck({
  name,
  label,
  checked,
}: {
  name: string
  label: string
  checked: boolean
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink">
      <input
        name={name}
        type="checkbox"
        defaultChecked={checked}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  )
}

function PromotionMutationForm({
  route,
  method,
  body,
  title,
  description,
  submitLabel,
  cancel,
  saved,
  reconcile,
  children,
}: {
  route: string
  method: 'POST' | 'PUT'
  body: (data: FormData) => unknown
  title: string
  description: string
  submitLabel: string
  cancel: () => void
  saved: () => void
  reconcile: () => void
  children: ReactNode
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [conflict, setConflict] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || uncertain || conflict) return
    const data = new FormData(event.currentTarget)
    let sent = false
    setBusy(true)
    setError('')
    try {
      const payload = body(data)
      sent = true
      await api.request(route, { method, body: payload })
      saved()
    } catch (reason) {
      setError(message(reason))
      if (sent) {
        if (reason instanceof ApiRequestError && reason.status === 409) {
          setConflict(true)
        } else if (
          !(reason instanceof ApiRequestError) ||
          reason.status === 408 ||
          reason.status === 499 ||
          reason.status >= 500
        ) {
          setUncertain(true)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <Tag size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-ink">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close promotion editor"
          onClick={cancel}
          disabled={busy}
        >
          <X size={17} aria-hidden="true" />
        </Button>
      </div>
      <fieldset
        disabled={busy || uncertain || conflict}
        className="grid gap-6 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div className="min-w-0 space-y-7">{children}</div>
        <aside className="space-y-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Info size={16} aria-hidden="true" />
              <p className="text-xs font-extrabold">Important rules</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-700">
              The server remains authoritative for eligibility, currency, quota
              claims and campaign timing. A coupon that reduces an order to zero
              cannot complete checkout in the current v1 flow.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-slate-50 p-4">
            <p className="text-xs font-extrabold text-ink">Schedule handling</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Date and time inputs use UTC, matching the schedule display.
              Values are sent as explicit ISO timestamps; the Backend evaluates
              eligibility using its database clock.
            </p>
          </div>
        </aside>
      </fieldset>
      <div className="space-y-3 border-t border-line bg-slate-50/70 px-4 py-4 sm:px-5">
        <ErrorMessage text={error} />
        {uncertain ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              role="alert"
              className="flex items-start gap-2 text-xs leading-5 text-amber-800"
            >
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              The server may have received this write. Do not submit it again
              until the current server records have been refreshed and
              inspected.
            </p>
            <Button type="button" variant="secondary" onClick={reconcile}>
              Close and refresh records
            </Button>
          </div>
        ) : conflict ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              role="alert"
              className="flex items-start gap-2 text-xs leading-5 text-amber-800"
            >
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              The server rejected this write because of a conflict. Refresh and
              inspect the current records before trying again; this may be a
              duplicate code/slug, invalid reference or stale revision.
            </p>
            <Button type="button" variant="secondary" onClick={reconcile}>
              Close and refresh records
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={cancel}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" busy={busy} pendingLabel="Saving…">
              {submitLabel}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}

function CouponForm({
  row,
  cancel,
  saved,
  reconcile,
}: {
  row: Coupon | null
  cancel: () => void
  saved: () => void
  reconcile: () => void
}) {
  return (
    <PromotionMutationForm
      route={'/v1/admin/promotions/coupons' + (row ? '/' + row.id : '')}
      method={row ? 'PUT' : 'POST'}
      title={row ? `Edit coupon · ${row.code}` : 'Create coupon'}
      description={
        row
          ? `Update this coupon rule. Current revision ${row.revision}.`
          : 'Define the discount, eligibility limits and availability window.'
      }
      submitLabel={row ? 'Save coupon changes' : 'Create coupon'}
      cancel={cancel}
      saved={saved}
      reconcile={reconcile}
      body={(data) => {
        const kind = String(data.get('kind') || '')
        const value = readBoundedInteger(data, 'value')
        const window = readPromotionWindow(data)
        if (kind === 'PERCENT' && value > 10000)
          throw new Error(
            'Percentage must be between 1 and 10,000 basis points.',
          )
        return {
          expectedRevision: row?.revision || 0,
          code: String(data.get('code') || '')
            .trim()
            .toUpperCase(),
          kind,
          value,
          currency: String(data.get('currency') || '')
            .trim()
            .toUpperCase(),
          minimumSubtotalMinor: readBoundedInteger(
            data,
            'minimumSubtotalMinor',
          ),
          maximumDiscountMinor: readNullableInteger(
            data,
            'maximumDiscountMinor',
          ),
          usageLimit: readNullableInteger(data, 'usageLimit'),
          perCustomerLimit: readNullableInteger(data, 'perCustomerLimit'),
          startsAt: window.startsAt,
          endsAt: window.endsAt,
          categoryId: nullableValue(data, 'categoryId'),
          campaignId: nullableValue(data, 'campaignId'),
          enabled: data.has('enabled'),
        }
      }}
    >
      <FormSection
        title="Coupon identity"
        description="The customer enters one normalized code at checkout."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionField
            name="code"
            label="Coupon code"
            value={row?.code || ''}
            required
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,23}"
            placeholder="WELCOME10"
            helper="3–24 characters. Saved in uppercase."
          />
          <PromotionSelect
            name="kind"
            label="Discount type"
            defaultValue={row?.kind || 'PERCENT'}
            options={[
              { value: 'PERCENT', label: 'Percentage discount' },
              { value: 'FIXED', label: 'Fixed amount discount' },
            ]}
          />
          <PromotionField
            name="value"
            label="Discount value"
            type="number"
            min={1}
            value={row?.value ?? 1000}
            required
            helper="Percentage: basis points (1,000 = 10%). Fixed: currency minor units."
          />
          <PromotionField
            name="currency"
            label="Exact currency"
            value={row?.currency || 'USD'}
            required
            minLength={3}
            maxLength={3}
            pattern="[A-Za-z]{3}"
            helper="Three-letter currency code. No foreign-exchange conversion is applied."
          />
        </div>
      </FormSection>

      <FormSection
        title="Eligibility and limits"
        description="These limits are enforced by the Backend when the coupon is claimed."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionField
            name="minimumSubtotalMinor"
            label="Minimum gross subtotal (minor units)"
            type="number"
            min={0}
            value={row?.minimumSubtotalMinor ?? 0}
            required
            helper="Eligibility is checked against gross merchandise subtotal."
          />
          <PromotionField
            name="maximumDiscountMinor"
            label="Maximum discount (minor units)"
            type="number"
            min={1}
            value={row?.maximumDiscountMinor ?? ''}
            helper="Optional cap. Leave blank for no cap."
          />
          <PromotionField
            name="usageLimit"
            label="Total usage limit"
            type="number"
            min={1}
            value={row?.usageLimit ?? ''}
            helper="Optional. Active holds and pending/paid orders consume this capacity. Blank is unlimited."
          />
          <PromotionField
            name="perCustomerLimit"
            label="Per-customer usage limit"
            type="number"
            min={1}
            value={row?.perCustomerLimit ?? ''}
            helper="Optional. Leave blank for unlimited claims per customer."
          />
          <PromotionField
            name="categoryId"
            label="Category UUID"
            value={row?.categoryId || ''}
            maxLength={36}
            pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
            helper="Optional canonical category ID. Exact category membership only; descendants are not included automatically. Blank applies to all categories."
            placeholder="Paste category UUID"
          />
          <PromotionField
            name="campaignId"
            label="Campaign UUID gate"
            value={row?.campaignId || ''}
            maxLength={36}
            pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
            helper="Optional canonical campaign ID. It gates eligibility but does not automatically apply the coupon."
            placeholder="Paste campaign UUID"
          />
        </div>
      </FormSection>

      <FormSection
        title="Availability window"
        description="The start is inclusive and the end is exclusive. Leave either blank for an unbounded side."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionField
            name="startsAt"
            label="Starts at"
            type="datetime-local"
            value={toUtcDateTimeInput(row?.startsAt)}
            helper="Entered in UTC to match the schedule display."
          />
          <PromotionField
            name="endsAt"
            label="Ends at"
            type="datetime-local"
            value={toUtcDateTimeInput(row?.endsAt)}
            helper="Entered in UTC to match the schedule display."
          />
        </div>
      </FormSection>

      <PromotionCheck
        name="enabled"
        label="Enable this coupon"
        checked={row?.enabled ?? false}
      />
    </PromotionMutationForm>
  )
}

function CampaignForm({
  row,
  cancel,
  saved,
  reconcile,
}: {
  row: Campaign | null
  cancel: () => void
  saved: () => void
  reconcile: () => void
}) {
  return (
    <PromotionMutationForm
      route={'/v1/admin/promotions/campaigns' + (row ? '/' + row.id : '')}
      method={row ? 'PUT' : 'POST'}
      title={row ? `Edit campaign · ${row.title}` : 'Create campaign'}
      description={
        row
          ? `Update editorial campaign details. Current revision ${row.revision}.`
          : 'Set the campaign identity, editorial status and schedule.'
      }
      submitLabel={row ? 'Save campaign changes' : 'Create campaign'}
      cancel={cancel}
      saved={saved}
      reconcile={reconcile}
      body={(data) => {
        const status = String(data.get('status') || '')
        const window = readPromotionWindow(data)
        if (
          ['ACTIVE', 'SCHEDULED'].includes(status) &&
          (!window.startsAt || !window.endsAt)
        )
          throw new Error(
            'Active and Scheduled campaigns require both start and end timestamps.',
          )
        return {
          expectedRevision: row?.revision || 0,
          title: String(data.get('title') || '').trim(),
          slug: String(data.get('slug') || '').trim(),
          description: String(data.get('description') || '').trim(),
          status,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        }
      }}
    >
      <FormSection
        title="Campaign identity"
        description="Keep the canonical slug stable when linking to this campaign from approved storefront content."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionField
            name="title"
            label="Campaign title"
            value={row?.title || ''}
            required
            minLength={3}
            maxLength={120}
            placeholder="Winter essentials"
          />
          <PromotionField
            name="slug"
            label="Canonical slug"
            value={row?.slug || ''}
            required
            maxLength={120}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="winter-essentials"
            helper="Lowercase letters, numbers and single hyphens."
          />
        </div>
        <PromotionTextArea
          name="description"
          label="Internal Admin notes"
          value={row?.description || ''}
          maxLength={2000}
          helper="Private management notes only; not included in public campaign summaries. Plain text only."
        />
      </FormSection>

      <FormSection
        title="Publication status"
        description="Campaign status controls its editorial lifecycle; it does not send notifications or change prices. Active and Scheduled campaigns require both start and end timestamps."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionSelect
            name="status"
            label="Campaign status"
            defaultValue={row?.status || 'DRAFT'}
            options={['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED'].map(
              (status) => ({
                value: status,
                label: status.charAt(0) + status.slice(1).toLowerCase(),
              }),
            )}
          />
        </div>
      </FormSection>

      <FormSection
        title="Campaign schedule"
        description="Start is inclusive and end is exclusive. The Backend database clock remains authoritative."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PromotionField
            name="startsAt"
            label="Starts at"
            type="datetime-local"
            value={toUtcDateTimeInput(row?.startsAt)}
            helper="Entered in UTC to match the schedule display."
          />
          <PromotionField
            name="endsAt"
            label="Ends at"
            type="datetime-local"
            value={toUtcDateTimeInput(row?.endsAt)}
            helper="Entered in UTC to match the schedule display."
          />
        </div>
      </FormSection>
    </PromotionMutationForm>
  )
}

function readPromotionWindow(data: FormData) {
  const startsAt = fromUtcDateTimeInput(String(data.get('startsAt') || ''))
  const endsAt = fromUtcDateTimeInput(String(data.get('endsAt') || ''))
  if (
    startsAt &&
    endsAt &&
    new Date(startsAt).getTime() >= new Date(endsAt).getTime()
  )
    throw new Error(
      'The start time must be earlier than the exclusive end time.',
    )
  return { startsAt, endsAt }
}

function nullableValue(data: FormData, key: string) {
  return String(data.get(key) || '').trim() || null
}

function readBoundedInteger(data: FormData, key: string) {
  const value = String(data.get(key) || '').trim()
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) > 2147483647
  )
    throw new Error(`Enter a bounded whole number for ${key}.`)
  return Number(value)
}

function readNullableInteger(data: FormData, key: string) {
  const value = String(data.get(key) || '').trim()
  if (!value) return null
  return readBoundedInteger(data, key)
}
