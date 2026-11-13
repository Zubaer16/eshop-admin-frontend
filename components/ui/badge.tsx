import { cn } from '@/lib/utils'
export function Badge({
  children,
  kind = 'neutral',
}: {
  children: React.ReactNode
  kind?: 'neutral' | 'success' | 'warning' | 'info' | 'danger'
}) {
  const kindClass = {
    neutral: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-800',
    info: 'bg-blue-50 text-blue-700',
    danger: 'bg-red-50 text-red-700',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        kindClass[kind],
      )}
    >
      {children}
    </span>
  )
}
export const statusKind = (
  status: string,
): 'neutral' | 'success' | 'warning' | 'info' | 'danger' => {
  status = status.toUpperCase()
  if (
    [
      'ACTIVE',
      'DELIVERED',
      'PAID',
      'PUBLISHED',
      'SUCCEEDED',
      'ENABLED',
    ].includes(status)
  )
    return 'success'
  if (['PROCESSING', 'SHIPPED', 'DISPATCHED', 'APPROVED'].includes(status))
    return 'info'
  if (['PENDING', 'PENDING_PAYMENT', 'REQUESTED', 'DRAFT'].includes(status))
    return 'warning'
  if (['CANCELLED', 'FAILED', 'DISABLED', 'REJECTED'].includes(status))
    return 'danger'
  return 'neutral'
}
