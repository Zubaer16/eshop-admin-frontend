/** eShop checkout contract alignment (frontend previews only).
 * Based on storefront lib/checkout-preview.ts, reviewed 2026-10-18.
 * Actual country eligibility, delivery quotes, taxes and payment status are backend-owned.
 */
import type { ShippingZone, ShippingService, TaxRule } from './types'

export const destinationCountries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Singapore',
  'Malaysia',
  'India',
  'Other country',
] as const
export const deliveryKinds = ['standard', 'express'] as const
export const serviceLabel = (kind: ShippingService['kind']) =>
  kind === 'standard' ? 'International standard' : 'International priority'
export const moneyIsValid = (value: number) =>
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 10000 &&
  Math.abs(Math.round(value * 100) - value * 100) < 1e-7

export function shippingZoneError(
  zone: ShippingZone,
  existing: ShippingZone[],
): string | null {
  if (zone.name.trim().length < 3)
    return 'Zone name must have at least 3 characters.'
  if (
    existing.some(
      (z) =>
        z.id !== zone.id &&
        z.name.trim().toLowerCase() === zone.name.trim().toLowerCase(),
    )
  )
    return 'Zone name must be unique.'
  if (!zone.countries.length) return 'Select at least one destination country.'
  if (
    new Set(zone.countries).size !== zone.countries.length ||
    zone.countries.some(
      (c) =>
        !destinationCountries.includes(
          c as (typeof destinationCountries)[number],
        ),
    )
  )
    return 'Choose valid, unique destination countries.'
  if (
    existing.some(
      (z) =>
        z.id !== zone.id && z.countries.some((c) => zone.countries.includes(c)),
    )
  )
    return 'A country is already assigned to another shipping zone.'
  if (
    zone.services.length !== 2 ||
    deliveryKinds.some(
      (k) => zone.services.filter((s) => s.kind === k).length !== 1,
    )
  )
    return 'Standard and express services must each be configured.'
  if (!zone.services.some((s) => s.enabled))
    return 'Enable at least one delivery service.'
  for (const service of zone.services) {
    if (!moneyIsValid(service.feeUsd) || !moneyIsValid(service.freeOverUsd))
      return 'Rates and free-shipping thresholds must be valid USD amounts (0–10,000, two decimals).'
    if (service.etaNote.trim().length > 100)
      return 'Delivery notes must be 100 characters or less.'
  }
  return null
}

export function taxRuleError(
  rule: TaxRule,
  existing: TaxRule[],
): string | null {
  if (
    !destinationCountries.includes(
      rule.country as (typeof destinationCountries)[number],
    )
  )
    return 'Select a valid destination country.'
  if (existing.some((r) => r.id !== rule.id && r.country === rule.country))
    return 'A tax preview rule already exists for this destination.'
  if (
    !Number.isFinite(rule.ratePercent) ||
    rule.ratePercent < 0 ||
    rule.ratePercent > 100 ||
    Math.abs(Math.round(rule.ratePercent * 100) - rule.ratePercent * 100) > 1e-7
  )
    return 'Tax preview percentage must be 0–100 with up to two decimals.'
  if (rule.note.trim().length > 200)
    return 'Tax note cannot exceed 200 characters.'
  return null
}

export type PreviewQuote = {
  country: string
  method: ShippingService['kind']
  subtotalUsd: number
  zoneName: string | null
  deliveryUsd: number | null
  taxUsd: number | null
  subtotalAndDeliveryUsd: number | null
}
export function previewQuote(
  zones: ShippingZone[],
  rules: TaxRule[],
  country: string,
  method: ShippingService['kind'],
  subtotalUsd: number,
): PreviewQuote {
  const result: PreviewQuote = {
    country,
    method,
    subtotalUsd,
    zoneName: null,
    deliveryUsd: null,
    taxUsd: null,
    subtotalAndDeliveryUsd: null,
  }
  if (!moneyIsValid(subtotalUsd)) return result
  const zone =
    zones.find((z) => z.enabled && z.countries.includes(country)) ??
    (country !== 'Other country'
      ? zones.find((z) => z.enabled && z.countries.includes('Other country'))
      : undefined)
  if (!zone) return result
  result.zoneName = zone.name
  const service = zone.services.find((s) => s.kind === method && s.enabled)
  if (!service) return result
  result.deliveryUsd =
    service.freeOverUsd > 0 && subtotalUsd >= service.freeOverUsd
      ? 0
      : service.feeUsd
  const tax = rules.find((r) => r.enabled && r.country === country)
  // Simplified demonstration ONLY; excludes real tax jurisdictions, thresholds, duties and shipping-taxability.
  result.taxUsd = tax ? Math.round(subtotalUsd * tax.ratePercent) / 100 : null
  result.subtotalAndDeliveryUsd =
    Math.round((subtotalUsd + result.deliveryUsd) * 100) / 100
  return result
}
