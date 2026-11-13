'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import type { Page } from '@/lib/api/catalog'
import {
  useResource,
  ResourceState,
  ErrorMessage,
  Pagination,
  message,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { Field, Check, MutationForm, fieldClass, text, number } from './forms'
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
const nullable = (data: FormData, key: string) => text(data, key) || null
export function Promotions() {
  const [tab, setTab] = useState<'coupons' | 'campaigns'>('coupons')
  return (
    <section className="space-y-6">
      <PageHeading title="Promotions" />
      <p className="text-sm text-muted">
        One coupon per checkout. Campaigns are editorial; they never
        automatically change prices or send messages. All money is in currency
        minor units; percentages use basis points.
      </p>
      <div className="flex gap-3">
        <Button
          variant={tab === 'coupons' ? 'primary' : 'secondary'}
          onClick={() => setTab('coupons')}
        >
          Coupons
        </Button>
        <Button
          variant={tab === 'campaigns' ? 'primary' : 'secondary'}
          onClick={() => setTab('campaigns')}
        >
          Campaigns
        </Button>
      </div>
      <PromotionList key={tab} kind={tab} />
    </section>
  )
}
function PromotionList({ kind }: { kind: 'coupons' | 'campaigns' }) {
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<Coupon | Campaign | null | undefined>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [usage, setUsage] = useState<{
      id: string
      activeClaims: number
      note: string
    } | null>(null)
  const route = '/v1/admin/promotions/' + kind,
    list = useResource<Page<Coupon | Campaign>>(route, {
      page,
      limit: 20,
      search: search || undefined,
    })
  const refresh = () => {
    setSelected(undefined)
    setUsage(null)
    list.reload()
  }
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-bold">
          Search {kind}
          <input
            className={fieldClass}
            value={search}
            maxLength={80}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </label>
        <Button onClick={() => setSelected(null)}>
          Create {kind === 'coupons' ? 'coupon' : 'campaign'}
        </Button>
        <Button variant="secondary" onClick={refresh}>
          Refresh promotions
        </Button>
      </div>
      <ErrorMessage text={error} />
      {selected !== undefined &&
        (kind === 'coupons' ? (
          <CouponForm
            key={(selected?.id || 'new') + ':' + (selected?.revision || 0)}
            row={selected as Coupon | null}
            saved={refresh}
          />
        ) : (
          <CampaignForm
            key={(selected?.id || 'new') + ':' + (selected?.revision || 0)}
            row={selected as Campaign | null}
            saved={refresh}
          />
        ))}
      {usage && (
        <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm">
          Coupon {usage.id}: {usage.activeClaims} active quota claims.{' '}
          {usage.note}
        </p>
      )}
      {list.data ? (
        <>
          <div className="space-y-3">
            {list.data.items.map((row) => (
              <article
                key={row.id}
                className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
              >
                <h2 className="font-bold">
                  {'code' in row ? row.code : row.title} · revision{' '}
                  {row.revision}
                </h2>
                <p className="break-all text-xs text-muted">{row.id}</p>
                {'code' in row ? (
                  <p className="text-sm">
                    {row.enabled ? 'Enabled' : 'Disabled'} · {row.kind} ·{' '}
                    {row.value} {row.kind === 'PERCENT' ? 'bps' : 'minor units'}{' '}
                    · {row.currency} · minimum {row.minimumSubtotalMinor} minor
                    · quota {row.usageLimit ?? 'unlimited'} / per customer{' '}
                    {row.perCustomerLimit ?? 'unlimited'}
                  </p>
                ) : (
                  <p className="text-sm">
                    {row.status} · {row.slug} · {row.description}
                  </p>
                )}
                <p className="text-xs">
                  Window: {row.startsAt || 'Unbounded'} (inclusive) to{' '}
                  {row.endsAt || 'Unbounded'} (exclusive)
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true)
                      setError('')
                      void api
                        .request<Coupon | Campaign>(route + '/' + row.id)
                        .then(setSelected)
                        .catch((e) => setError(message(e)))
                        .finally(() => setBusy(false))
                    }}
                  >
                    Edit current record
                  </Button>
                  {'code' in row && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true)
                        setError('')
                        void api
                          .request<{ activeClaims: number; note: string }>(
                            route + '/' + row.id + '/usage',
                          )
                          .then((value) => setUsage({ id: row.id, ...value }))
                          .catch((e) => setError(message(e)))
                          .finally(() => setBusy(false))
                      }}
                    >
                      Read quota usage
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !window.confirm(
                          kind === 'coupons'
                            ? 'Disable this coupon while preserving history and existing holds?'
                            : 'Pause this campaign while preserving history?',
                        )
                      )
                        return
                      setBusy(true)
                      setError('')
                      void api
                        .request(route + '/' + row.id, {
                          method: 'DELETE',
                          query: { expectedRevision: row.revision },
                        })
                        .then(refresh)
                        .catch((e) => {
                          setError(message(e))
                          list.reload()
                        })
                        .finally(() => setBusy(false))
                    }}
                  >
                    {kind === 'coupons' ? 'Disable coupon' : 'Pause campaign'}
                  </Button>
                </div>
              </article>
            ))}
            {!list.data.items.length && <p>No matching promotions.</p>}
          </div>
          <Pagination data={list.data} change={setPage} />
        </>
      ) : (
        <ResourceState error={list.error} retry={list.reload} />
      )}
    </>
  )
}
function CouponForm({ row, saved }: { row: Coupon | null; saved: () => void }) {
  return (
    <MutationForm
      route={'/v1/admin/promotions/coupons' + (row ? '/' + row.id : '')}
      method={row ? 'PUT' : 'POST'}
      saved={saved}
      body={(data) => ({
        expectedRevision: row?.revision || 0,
        code: text(data, 'code').toUpperCase(),
        kind: text(data, 'kind'),
        value: number(data, 'value'),
        currency: text(data, 'currency').toUpperCase(),
        minimumSubtotalMinor: number(data, 'minimumSubtotalMinor'),
        maximumDiscountMinor: number(data, 'maximumDiscountMinor', true),
        usageLimit: number(data, 'usageLimit', true),
        perCustomerLimit: number(data, 'perCustomerLimit', true),
        startsAt: nullable(data, 'startsAt'),
        endsAt: nullable(data, 'endsAt'),
        categoryId: nullable(data, 'categoryId'),
        campaignId: nullable(data, 'campaignId'),
        enabled: data.has('enabled'),
      })}
    >
      <Field name="code" label="Coupon code" value={row?.code} required />
      <label className="text-sm font-bold">
        Discount kind
        <select
          name="kind"
          className={fieldClass}
          defaultValue={row?.kind || 'PERCENT'}
        >
          <option value="PERCENT">Percent basis points</option>
          <option value="FIXED">Fixed minor units</option>
        </select>
      </label>
      <Field
        name="value"
        label="Value (1000 bps = 10%; fixed = minor units)"
        type="number"
        min={1}
        value={row?.value ?? 1000}
        required
      />
      <Field
        name="currency"
        label="Exact currency"
        value={row?.currency || 'USD'}
        required
      />
      <Field
        name="minimumSubtotalMinor"
        label="Minimum gross subtotal (minor units)"
        type="number"
        min={0}
        value={row?.minimumSubtotalMinor ?? 0}
        required
      />
      {(
        ['maximumDiscountMinor', 'usageLimit', 'perCustomerLimit'] as const
      ).map((key) => (
        <Field
          key={key}
          name={key}
          label={key + ' (blank = unlimited)'}
          type="number"
          min={1}
          value={row?.[key] ?? ''}
        />
      ))}
      <WindowFields row={row} />
      <Field
        name="categoryId"
        label="Exact category UUID (blank = all products)"
        value={row?.categoryId || ''}
      />
      <Field
        name="campaignId"
        label="Campaign UUID gate (optional)"
        value={row?.campaignId || ''}
      />
      <Check name="enabled" label="Enable coupon" value={row?.enabled} />
    </MutationForm>
  )
}
function WindowFields({
  row,
}: {
  row: { startsAt: string | null; endsAt: string | null } | null
}) {
  return (
    <>
      <Field
        name="startsAt"
        label="Inclusive start ISO timestamp with timezone (optional)"
        value={row?.startsAt || ''}
      />
      <Field
        name="endsAt"
        label="Exclusive end ISO timestamp with timezone (optional)"
        value={row?.endsAt || ''}
      />
    </>
  )
}
function CampaignForm({
  row,
  saved,
}: {
  row: Campaign | null
  saved: () => void
}) {
  return (
    <MutationForm
      route={'/v1/admin/promotions/campaigns' + (row ? '/' + row.id : '')}
      method={row ? 'PUT' : 'POST'}
      saved={saved}
      body={(data) => ({
        expectedRevision: row?.revision || 0,
        title: text(data, 'title'),
        slug: text(data, 'slug'),
        description: text(data, 'description'),
        status: text(data, 'status'),
        startsAt: nullable(data, 'startsAt'),
        endsAt: nullable(data, 'endsAt'),
      })}
    >
      <Field name="title" label="Campaign title" value={row?.title} required />
      <Field name="slug" label="Canonical slug" value={row?.slug} required />
      <label className="text-sm font-bold">
        Admin notes
        <textarea
          name="description"
          className={fieldClass}
          defaultValue={row?.description || ''}
          maxLength={2000}
        />
      </label>
      <label className="text-sm font-bold">
        Status
        <select
          name="status"
          className={fieldClass}
          defaultValue={row?.status || 'DRAFT'}
        >
          {['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED'].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <WindowFields row={row} />
    </MutationForm>
  )
}
