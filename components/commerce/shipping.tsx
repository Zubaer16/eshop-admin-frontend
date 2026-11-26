'use client'
import { PageHeading } from '@/components/layout/page-heading'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import { useAuth } from '@/components/auth/auth-provider'
import {
  useResource,
  ResourceState,
  ErrorMessage,
  message,
} from '@/components/catalog/shared'
import { Button } from '@/components/ui/button'
import { Badge, statusKind } from '@/components/ui/badge'
import { Panel, SectionHeading } from '@/components/ui/panel'
import { AdminEmptyState, AdminNotice } from '@/components/ui/admin-workspace'
import { Field, Check, MutationForm, text, number } from './forms'
type Rate = {
  id: string
  countryCode: string
  currency: string
  shippingMinor: number
  freeOverSubtotalMinor: number | null
  enabled: boolean
}
type DefaultRate = Omit<Rate, 'id' | 'countryCode' | 'enabled'> & {
  revision: number
}
type Service = {
  kind: 'standard' | 'express'
  shippingMinor: number
  freeOverSubtotalMinor: number | null
  etaNote: string
  enabled: boolean
}
type Zone = {
  id: string
  revision: number
  name: string
  currency: string
  countries: string[]
  enabled: boolean
  services: Service[]
}
export function Shipping() {
  const { session } = useAuth()
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="FULFILLMENT CONFIGURATION"
        title="Shipping & taxes"
        description="Review store defaults, country-specific delivery rates and configured service zones."
      />
      {session.user?.role === 'OWNER' ? (
        <ShippingEditor />
      ) : (
        <AdminNotice title="Owner access required" tone="warning">
          Only the store owner can read or configure default charges, country
          delivery rates and delivery zones. Shipping operations remain
          available with orders.
        </AdminNotice>
      )}
    </section>
  )
}
function ShippingEditor() {
  const rates = useResource<Rate[]>('/v1/admin/checkout/rates'),
    zones = useResource<Zone[]>('/v1/admin/checkout/zones')
  const [rate, setRate] = useState<Rate | null | undefined>(),
    [zone, setZone] = useState<Zone | null | undefined>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const refresh = () => {
    setRate(undefined)
    setZone(undefined)
    rates.reload()
    zones.reload()
  }
  return (
    <div className="space-y-6">
      <AdminNotice title="How delivery pricing is applied">
        Configure default delivery charges for each selling currency. Country
        policies override these defaults, and delivery zones provide service
        choices. Enter money in minor units. Currencies without an enabled
        country rate or saved default use free delivery.
      </AdminNotice>
      <DefaultRatesEditor />
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Country delivery rates"
            subtitle={
              rates.data
                ? `${rates.data.length.toLocaleString('en-US')} configured country/currency lanes`
                : 'Country-specific checkout policies'
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setRate(null)}>
              Configure country rate
            </Button>
            <Button
              variant="ghost"
              busy={rates.isRefreshing || zones.isRefreshing}
              pendingLabel="Refreshing…"
              onClick={refresh}
            >
              Refresh policies
            </Button>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <ErrorMessage text={error} />
          {rate !== undefined && (
            <div className="mb-5">
              <MutationForm
                key={rate?.id || 'new-rate'}
                route="/v1/admin/checkout/rates"
                method="PUT"
                saved={refresh}
                title={
                  rate
                    ? `Edit ${rate.countryCode} delivery rate`
                    : 'Configure country delivery rate'
                }
                description="Country rates override store defaults for the matching currency lane. Amounts are whole minor units."
                body={(data) => ({
                  countryCode: text(data, 'countryCode').toUpperCase(),
                  currency: text(data, 'currency').toUpperCase(),
                  shippingMinor: number(data, 'shippingMinor', true) ?? 0,
                  freeOverSubtotalMinor: number(
                    data,
                    'freeOverSubtotalMinor',
                    true,
                  ),
                  enabled: data.has('enabled'),
                })}
              >
                <Field
                  name="countryCode"
                  label="ISO country code"
                  value={rate?.countryCode}
                  required
                />
                <Field
                  name="currency"
                  label="Currency code"
                  value={rate?.currency || 'USD'}
                  required
                />
                <Field
                  name="shippingMinor"
                  label="Flat shipping (minor units)"
                  type="number"
                  min={0}
                  value={rate?.shippingMinor ?? 0}
                />
                <Field
                  name="freeOverSubtotalMinor"
                  label="Free over merchandise subtotal (blank disables)"
                  type="number"
                  min={0}
                  value={rate?.freeOverSubtotalMinor ?? ''}
                />
                <Check
                  name="enabled"
                  label="Use this country delivery rate"
                  value={rate?.enabled}
                />
              </MutationForm>
            </div>
          )}
          {rates.data ? (
            rates.data.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rates.data.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-tight text-ink">
                          {item.countryCode}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">
                          {item.currency} lane
                        </p>
                      </div>
                      <Badge kind={item.enabled ? 'success' : 'neutral'}>
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-muted">Flat shipping</dt>
                        <dd className="mt-1 font-bold tabular-nums text-ink">
                          {item.shippingMinor.toLocaleString('en-US')}{' '}
                          <span className="font-medium text-muted">minor</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Free threshold</dt>
                        <dd className="mt-1 font-bold tabular-nums text-ink">
                          {item.freeOverSubtotalMinor === null
                            ? 'Disabled'
                            : `${item.freeOverSubtotalMinor.toLocaleString('en-US')} minor`}
                        </dd>
                      </div>
                    </dl>
                    <Button
                      className="mt-4 w-full"
                      size="sm"
                      variant="secondary"
                      onClick={() => setRate(item)}
                    >
                      Edit country rate
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="No country rates configured"
                description="Store defaults remain the fallback where no enabled country-specific rate is configured."
              />
            )
          ) : (
            <ResourceState
              error={rates.error}
              retry={rates.reload}
              variant="grid"
            />
          )}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Delivery zones"
            subtitle={
              zones.data
                ? `${zones.data.length.toLocaleString('en-US')} configured zones`
                : 'Country groups and service choices'
            }
            action={
              <Button size="sm" onClick={() => setZone(null)}>
                Create zone
              </Button>
            }
          />
        </div>
        <div className="p-4 sm:p-5">
          {zone !== undefined && (
            <div className="mb-5">
              <MutationForm
                key={(zone?.id || 'new-zone') + ':' + (zone?.revision || 0)}
                route={'/v1/admin/checkout/zones' + (zone ? '/' + zone.id : '')}
                method={zone ? 'PUT' : 'POST'}
                saved={refresh}
                title={zone ? `Edit ${zone.name}` : 'Create delivery zone'}
                description="A zone groups country codes and the standard/express service options for one currency."
                body={(data) => ({
                  expectedRevision: zone?.revision || 0,
                  name: text(data, 'name'),
                  currency: text(data, 'currency').toUpperCase(),
                  countries: text(data, 'countries')
                    .toUpperCase()
                    .split(/[\s,]+/)
                    .filter(Boolean),
                  enabled: data.has('enabled'),
                  services: (['standard', 'express'] as const).map((kind) => ({
                    kind,
                    shippingMinor: number(data, kind + 'Shipping'),
                    freeOverSubtotalMinor: number(data, kind + 'Free', true),
                    etaNote: text(data, kind + 'Eta'),
                    enabled: data.has(kind + 'Enabled'),
                  })),
                })}
              >
                <Field
                  name="name"
                  label="Zone name"
                  value={zone?.name}
                  required
                />
                <Field
                  name="currency"
                  label="Zone currency"
                  value={zone?.currency || 'USD'}
                  required
                />
                <Field
                  name="countries"
                  label="Country codes (comma separated)"
                  value={zone?.countries.join(', ')}
                  required
                />
                <Check
                  name="enabled"
                  label="Enable zone"
                  value={zone?.enabled}
                />
                {(['standard', 'express'] as const).map((kind) => {
                  const service = zone?.services.find(
                    (item) => item.kind === kind,
                  )
                  return (
                    <div
                      key={kind}
                      className="space-y-3 rounded-2xl border border-line bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-extrabold capitalize text-ink">
                          {kind} service
                        </h4>
                        <Badge kind={service?.enabled ? 'success' : 'neutral'}>
                          {service?.enabled ? 'Enabled' : 'Not enabled'}
                        </Badge>
                      </div>
                      <Field
                        name={kind + 'Shipping'}
                        label={kind + ' shipping (minor units)'}
                        type="number"
                        min={0}
                        value={service?.shippingMinor ?? 0}
                        required
                      />
                      <Field
                        name={kind + 'Free'}
                        label={kind + ' free threshold (blank disables)'}
                        type="number"
                        min={0}
                        value={service?.freeOverSubtotalMinor ?? ''}
                      />
                      <Field
                        name={kind + 'Eta'}
                        label={kind + ' informational ETA'}
                        value={service?.etaNote}
                      />
                      <Check
                        name={kind + 'Enabled'}
                        label={'Enable ' + kind}
                        value={service?.enabled}
                      />
                    </div>
                  )
                })}
              </MutationForm>
            </div>
          )}
          {zones.data ? (
            zones.data.length ? (
              <div className="grid gap-3 xl:grid-cols-2">
                {zones.data.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-line bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-extrabold text-ink">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          {item.currency} · Revision {item.revision}
                        </p>
                      </div>
                      <Badge kind={item.enabled ? 'success' : 'neutral'}>
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-muted">
                        Countries
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.countries.map((country) => (
                          <Badge key={country}>{country}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {item.services.map((service) => (
                        <div
                          key={service.kind}
                          className="rounded-xl bg-slate-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-extrabold capitalize text-ink">
                              {service.kind}
                            </p>
                            <Badge
                              kind={service.enabled ? 'success' : 'neutral'}
                            >
                              {service.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-bold tabular-nums text-ink">
                            {service.shippingMinor.toLocaleString('en-US')}{' '}
                            minor
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Free threshold:{' '}
                            {service.freeOverSubtotalMinor === null
                              ? 'disabled'
                              : `${service.freeOverSubtotalMinor.toLocaleString('en-US')} minor`}
                          </p>
                          {service.etaNote && (
                            <p className="mt-1 text-xs text-muted">
                              {service.etaNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setZone(item)}
                      >
                        Edit zone
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !window.confirm(
                              'Delete this zone and use country or store-default shipping rates?',
                            )
                          )
                            return
                          setBusy(true)
                          setError('')
                          void api
                            .request('/v1/admin/checkout/zones/' + item.id, {
                              method: 'DELETE',
                              query: { expectedRevision: item.revision },
                            })
                            .then(refresh)
                            .catch((reason) => {
                              setError(message(reason))
                              zones.reload()
                            })
                            .finally(() => setBusy(false))
                        }}
                      >
                        Delete zone
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <AdminEmptyState
                title="No delivery zones configured"
                description="Country and store-default rates continue to provide delivery where no zone is configured."
              />
            )
          ) : (
            <ResourceState
              error={zones.error}
              retry={zones.reload}
              variant="grid"
            />
          )}
        </div>
      </Panel>
    </div>
  )
}

function DefaultRatesEditor() {
  const rates = useResource<DefaultRate[]>('/v1/admin/checkout/defaults')
  const [editing, setEditing] = useState<DefaultRate | null | undefined>()
  function refresh() {
    setEditing(undefined)
    rates.reload()
  }
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <SectionHeading
          title="Default delivery charges"
          subtitle="Fallback charges by selling currency"
          action={
            <Button size="sm" onClick={() => setEditing(null)}>
              Configure default rate
            </Button>
          }
        />
      </div>
      <div className="p-4 sm:p-5">
        {editing !== undefined && (
          <div className="mb-5">
            <MutationForm
              key={editing?.currency || 'new-default'}
              route="/v1/admin/checkout/defaults"
              method="PUT"
              saved={refresh}
              title={
                editing
                  ? `Edit ${editing.currency} default`
                  : 'Configure default rate'
              }
              description="Default rates apply only when no enabled country-specific rate overrides the same currency."
              body={(data) => ({
                currency: text(data, 'currency').toUpperCase(),
                expectedRevision: editing?.revision ?? 0,
                shippingMinor: number(data, 'shippingMinor', true) ?? 0,
                freeOverSubtotalMinor: number(
                  data,
                  'freeOverSubtotalMinor',
                  true,
                ),
              })}
            >
              {editing ? (
                <div>
                  <p className="text-sm font-bold">Currency</p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {editing.currency}
                  </p>
                  <input
                    type="hidden"
                    name="currency"
                    value={editing.currency}
                  />
                </div>
              ) : (
                <Field
                  name="currency"
                  label="Default currency code"
                  value="USD"
                  required
                />
              )}
              <Field
                name="shippingMinor"
                label="Default shipping (minor units)"
                type="number"
                min={0}
                value={editing?.shippingMinor ?? 0}
              />
              <Field
                name="freeOverSubtotalMinor"
                label="Default free-delivery threshold (blank disables)"
                type="number"
                min={0}
                value={editing?.freeOverSubtotalMinor ?? ''}
              />
            </MutationForm>
          </div>
        )}
        {rates.data ? (
          rates.data.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rates.data.map((item) => (
                <article
                  key={item.currency}
                  className="rounded-2xl border border-line bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-black text-ink">
                      {item.currency}
                    </h3>
                    <Badge>Revision {item.revision}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted">Default shipping</p>
                  <p className="text-xl font-extrabold tabular-nums text-ink">
                    {item.shippingMinor.toLocaleString('en-US')}{' '}
                    <span className="text-xs font-semibold text-muted">
                      minor units
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Free threshold:{' '}
                    {item.freeOverSubtotalMinor === null
                      ? 'disabled'
                      : `${item.freeOverSubtotalMinor.toLocaleString('en-US')} minor units`}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditing(item)}
                  >
                    Edit default rate
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No default rates saved"
              description="Configure a default rate for each currency that needs a store-wide fallback."
            />
          )
        ) : (
          <ResourceState
            error={rates.error}
            retry={rates.reload}
            variant="grid"
          />
        )}
      </div>
    </Panel>
  )
}
