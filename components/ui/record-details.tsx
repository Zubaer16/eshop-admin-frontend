'use client'
import { Badge, statusKind } from './badge'
import { displayDate, displayLabel, formatMinor } from '@/lib/presentation'

type RecordValue = Record<string, unknown>
const object = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export function RecordDetails({
  value,
  field = '',
  currency = '',
}: {
  value: unknown
  field?: string
  currency?: string
}) {
  if (value === null || value === undefined)
    return <span className="text-muted">Unavailable</span>
  if (typeof value === 'boolean')
    return (
      <Badge kind={value ? 'success' : 'neutral'}>{value ? 'Yes' : 'No'}</Badge>
    )
  if (typeof value !== 'object') {
    const text = String(value)
    if (/Minor$/.test(field) && currency)
      return (
        <span className="whitespace-nowrap font-semibold tabular-nums">
          {formatMinor(value, currency)}
        </span>
      )
    if (/^\d{4}-\d{2}-\d{2}T/.test(text))
      return (
        <time dateTime={text} className="whitespace-nowrap text-muted">
          {displayDate(text)}
        </time>
      )
    if (/status|state$/i.test(field))
      return (
        <Badge kind={statusKind(text)}>
          {displayLabel(text.toLowerCase())}
        </Badge>
      )
    return (
      <span className="break-words whitespace-pre-wrap tabular-nums">
        {text || '—'}
      </span>
    )
  }
  if (Array.isArray(value)) {
    if (!value.length)
      return <p className="p-5 text-sm text-muted">No records to show.</p>
    if (value.every((item) => typeof item === 'string'))
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <Badge key={index}>{item}</Badge>
          ))}
        </div>
      )
    if (value.every(object)) {
      const keys = [
        ...new Set(
          value.flatMap((row) =>
            Object.keys(row).filter(
              (key) => row[key] === null || typeof row[key] !== 'object',
            ),
          ),
        ),
      ]
      const columns = keys.slice(0, 7)
      return (
        <div
          className="table-scroll rounded-2xl border border-line bg-white"
          tabIndex={0}
          role="region"
          aria-label="Records table"
        >
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((key) => (
                  <th key={key}>{displayLabel(key)}</th>
                ))}
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {value.map((row, index) => (
                <tr key={String(row.id ?? row.key ?? index)}>
                  {columns.map((key) => (
                    <td key={key} className="max-w-64">
                      <RecordDetails
                        value={row[key]}
                        field={key}
                        currency={
                          typeof row.currency === 'string'
                            ? row.currency
                            : currency
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <details>
                      <summary className="cursor-pointer whitespace-nowrap text-xs font-bold text-primary">
                        View details
                      </summary>
                      <div className="min-w-64 py-4">
                        <RecordDetails value={row} currency={currency} />
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <RecordDetails key={index} value={item} currency={currency} />
        ))}
      </div>
    )
  }
  const row = value as RecordValue
  const unit = typeof row.currency === 'string' ? row.currency : currency
  const scalar = Object.entries(row).filter(
    ([, v]) => v === null || typeof v !== 'object',
  )
  const nested = Object.entries(row).filter(
    ([, v]) => v !== null && typeof v === 'object',
  )
  return (
    <div className="space-y-5">
      {scalar.length > 0 && (
        <dl className="grid gap-x-6 gap-y-4 rounded-2xl border border-line bg-white p-5 text-sm sm:grid-cols-2 xl:grid-cols-3">
          {scalar.map(([key, v]) => (
            <div key={key} className="min-w-0">
              <dt className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                {displayLabel(key)}
              </dt>
              <dd>
                <RecordDetails value={v} field={key} currency={unit} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {nested.map(([key, v]) => (
        <section key={key} className="space-y-3">
          <h3 className="text-sm font-extrabold text-ink">
            {displayLabel(key)}
          </h3>
          <RecordDetails value={v} field={key} currency={unit} />
        </section>
      ))}
    </div>
  )
}
