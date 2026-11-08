import { Children, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'
export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      <span>{label}</span>
      <div className="mt-1.5">
        {Children.map(children, (child) =>
          isValidElement<{ 'aria-label'?: string }>(child) &&
          typeof child.type === 'string' &&
          ['input', 'select', 'textarea'].includes(child.type)
            ? cloneElement(child, {
                'aria-label': child.props['aria-label'] ?? label,
              })
            : child,
        )}
      </div>
      {hint && (
        <span className="mt-1 block text-xs font-normal text-muted">
          {hint}
        </span>
      )}
    </label>
  )
}
export const controlClass = cn(
  'h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10',
)
