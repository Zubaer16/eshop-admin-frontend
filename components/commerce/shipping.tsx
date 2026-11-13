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
  taxBps: number
  enabled: boolean
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
      <PageHeading title="Shipping and tax policies" />
      {session.user?.role === 'OWNER' ? (
        <ShippingEditor />
      ) : (
        <p role="status">
          Only the store owner can read or configure checkout country/currency
          lanes and delivery zones. Shipping operations are available with
          orders.
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
        Exact currency minor units; tax in basis points (1000 = 10%). Zones
        configure delivery only: an enabled tax lane is also required. No
        currency conversion.
      </p>
      <ErrorMessage text={error} />
      <div className="flex gap-3">
        <Button onClick={() => setRate(null)}>
          Configure country/tax lane
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
            shippingMinor: number(data, 'shippingMinor'),
            freeOverSubtotalMinor: number(data, 'freeOverSubtotalMinor', true),
            taxBps: number(data, 'taxBps'),
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
            required
          />
          <Field
            name="freeOverSubtotalMinor"
            label="Free over merchandise subtotal (blank disables)"
            type="number"
            min={0}
            value={rate?.freeOverSubtotalMinor ?? ''}
          />
          <Field
            name="taxBps"
            label="Tax basis points"
            type="number"
            min={0}
            max={10000}
            value={rate?.taxBps ?? 0}
            required
          />
          <Check
            name="enabled"
            label="Enable this country/currency lane"
            value={rate?.enabled}
          />
        </MutationForm>
      )}
      <h2 className="text-xl font-bold">Country and tax lanes</h2>
      {rates.data ? (
        <div className="space-y-3">
          {rates.data.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p>
                {r.countryCode} / {r.currency} ·{' '}
                {r.enabled ? 'Enabled' : 'Disabled'} · tax {r.taxBps} bps · flat
                shipping {r.shippingMinor} minor · free threshold{' '}
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
                        'Delete this zone? The configured flat-rate tax lanes become the fallback. Existing order totals stay unchanged.',
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
              No delivery zones. Enabled country/currency lanes use their flat
              shipping rate.
            </p>
          )}
        </div>
      ) : (
        <ResourceState error={zones.error} retry={zones.reload} />
      )}
    </>
  )
}
