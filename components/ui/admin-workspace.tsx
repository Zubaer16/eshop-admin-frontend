import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AdminTabItem = {
  value: string
  label: string
  description?: string
}

export function AdminTabs({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: readonly AdminTabItem[]
  value: string
  onChange: (value: string) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-[0_3px_14px_rgba(15,23,42,.035)]',
        className,
      )}
    >
      {items.map((item) => {
        const active = value === item.value
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            title={item.description}
            className={cn(
              'min-h-10 rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              active
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-ink',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function AdminNotice({
  title,
  children,
  tone = 'info',
  className,
}: {
  title?: string
  children: ReactNode
  tone?: 'info' | 'warning' | 'success'
  className?: string
}) {
  const tones = {
    info: 'border-blue-100 bg-blue-50/70 text-blue-950',
    warning: 'border-amber-200 bg-amber-50/80 text-amber-950',
    success: 'border-emerald-100 bg-emerald-50/70 text-emerald-950',
  }
  return (
    <aside
      role="note"
      className={cn(
        'rounded-2xl border px-4 py-3.5 text-sm leading-relaxed',
        tones[tone],
        className,
      )}
    >
      {title && <p className="mb-1 font-extrabold">{title}</p>}
      <div className="text-sm leading-relaxed">{children}</div>
    </aside>
  )
}

export function AdminMetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  icon?: ReactNode
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-[0_3px_18px_rgba(15,23,42,.025)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-muted">
          {label}
        </p>
        {icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-black tracking-tight text-ink tabular-nums">
        {value}
      </div>
      {detail && (
        <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>
      )}
    </article>
  )
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center">
      <p className="text-sm font-extrabold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  )
}
