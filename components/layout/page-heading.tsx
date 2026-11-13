import type { ReactNode } from 'react'
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[11px] font-black uppercase tracking-[.2em] text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-black tracking-[-.04em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
