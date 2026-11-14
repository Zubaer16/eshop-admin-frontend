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
      <PageHeading title="Delivery settings" />
      {session.user?.role === 'OWNER' ? (
        <ShippingEditor />
      ) : (
        <p role="status">
          Only the store owner can read or configure default charges, country
          delivery rates and delivery zones. Shipping operations are available
          with orders.
        </p>
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
    <>
      <p className="text-sm text-muted">
        Configure default delivery charges for each selling currency. Country
        policies override these defaults, and delivery zones provide service
        choices. Enter money in minor units. Currencies without an enabled
        country rate or saved default use free delivery.
      </p>
      <DefaultRatesEditor />
      <ErrorMessage text={error} />
      <div className="flex gap-3">
        <Button onClick={() => setRate(null)}>
          Configure country delivery rate
        </Button>
        <Button onClick={() => setZone(null)}>Create delivery zone</Button>
        <Button variant="secondary" onClick={refresh}>
          Refresh policies
        </Button>
      </div>
      {rate !== undefined && (
        <MutationForm
          key={rate?.id || 'new-rate'}
          route="/v1/admin/checkout/rates"
          method="PUT"
          saved={refresh}
          body={(data) => ({
            countryCode: text(data, 'countryCode').toUpperCase(),
            currency: text(data, 'currency').toUpperCase(),
            shippingMinor: number(data, 'shippingMinor', true) ?? 0,
            freeOverSubtotalMinor: number(data, 'freeOverSubtotalMinor', true),
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
      )}
      <h2 className="text-xl font-bold">Country delivery rates</h2>
      {rates.data ? (
        <div className="space-y-3">
          {rates.data.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p>
                {r.countryCode} / {r.currency} ·{' '}
                {r.enabled ? 'Enabled' : 'Disabled'} · flat shipping{' '}
                {r.shippingMinor} minor · free threshold{' '}
                {r.freeOverSubtotalMinor ?? 'disabled'}
              </p>
              <Button variant="secondary" onClick={() => setRate(r)}>
                Edit {r.countryCode}/{r.currency}
              </Button>
            </article>
          ))}
          {!rates.data.length && <p>No configured lanes.</p>}
        </div>
      ) : (
        <ResourceState error={rates.error} retry={rates.reload} />
      )}
      {zone !== undefined && (
        <MutationForm
          key={(zone?.id || 'new-zone') + ':' + (zone?.revision || 0)}
          route={'/v1/admin/checkout/zones' + (zone ? '/' + zone.id : '')}
          method={zone ? 'PUT' : 'POST'}
          saved={refresh}
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
          <Field name="name" label="Zone name" value={zone?.name} required />
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
          <Check name="enabled" label="Enable zone" value={zone?.enabled} />
          {(['standard', 'express'] as const).map((kind) => {
            const service = zone?.services.find((s) => s.kind === kind)
            return (
              <div key={kind} className="space-y-3 rounded-xl border p-3">
                <h3 className="font-bold">{kind}</h3>
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
      )}
      <h2 className="text-xl font-bold">Delivery zones</h2>
      {zones.data ? (
        <div className="space-y-3">
          {zones.data.map((z) => (
            <article
              key={z.id}
              className="space-y-3 rounded-xl border border-slate-200 p-4"
            >
              <p className="font-bold">
                {z.name} · {z.currency} · revision {z.revision} ·{' '}
                {z.enabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-sm">{z.countries.join(', ')}</p>
              {z.services.map((s) => (
                <p key={s.kind} className="text-sm">
                  {s.kind} · {s.enabled ? 'Enabled' : 'Disabled'} ·{' '}
                  {s.shippingMinor} minor · {s.etaNote}
                </p>
              ))}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setZone(z)}
                >
                  Edit zone
                </Button>
                <Button
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
                      .request('/v1/admin/checkout/zones/' + z.id, {
                        method: 'DELETE',
                        query: { expectedRevision: z.revision },
                      })
                      .then(refresh)
                      .catch((e) => {
                        setError(message(e))
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
          {!zones.data.length && (
            <p>
              Country and store-default rates provide delivery when a zone is
              not configured.
            </p>
          )}
        </div>
      ) : (
        <ResourceState error={zones.error} retry={zones.reload} />
      )}
    </>
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Default delivery charges</h2>
        <Button onClick={() => setEditing(null)}>Configure default rate</Button>
      </div>
      {editing !== undefined && (
        <MutationForm
          key={editing?.currency || 'new-default'}
          route="/v1/admin/checkout/defaults"
          method="PUT"
          saved={refresh}
          body={(data) => ({
            currency: text(data, 'currency').toUpperCase(),
            expectedRevision: editing?.revision ?? 0,
            shippingMinor: number(data, 'shippingMinor', true) ?? 0,
            freeOverSubtotalMinor: number(data, 'freeOverSubtotalMinor', true),
          })}
        >
          {editing ? (
            <div>
              <p className="text-sm font-bold">Currency</p>
              <p className="mt-2">{editing.currency}</p>
              <input type="hidden" name="currency" value={editing.currency} />
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
      )}
      {rates.data ? (
        <div className="space-y-3">
          {rates.data.map((rate) => (
            <article
              key={rate.currency}
              className="space-y-3 rounded-xl border border-slate-200 p-4"
            >
              <p className="font-bold">{rate.currency}</p>
              <p className="text-sm">
                Shipping {rate.shippingMinor} minor · free threshold{' '}
                {rate.freeOverSubtotalMinor ?? 'disabled'}
              </p>
              <Button variant="secondary" onClick={() => setEditing(rate)}>
                Edit default {rate.currency}
              </Button>
            </article>
          ))}
          {!rates.data.length && (
            <p className="text-sm text-muted">No saved default rates.</p>
          )}
        </div>
      ) : (
        <ResourceState error={rates.error} retry={rates.reload} />
      )}
    </section>
  )
}
