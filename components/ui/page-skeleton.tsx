'use client'

import { cn } from '@/lib/utils'

type Variant = 'dashboard' | 'table' | 'grid' | 'form' | 'detail'

function Shape({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-slate-200/80', className)}
    />
  )
}

function TableSkeleton() {
  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-line p-4">
        <Shape className="h-6 w-36" />
        <Shape className="h-9 w-24" />
      </div>
      <div className="table-scroll">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-4 gap-5 border-b border-line bg-slate-50 px-5 py-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Shape key={index} className="h-3 w-3/4" />
            ))}
          </div>
          {Array.from({ length: 5 }, (_, row) => (
            <div
              key={row}
              className="grid grid-cols-4 items-center gap-5 border-b border-line px-5 py-5 last:border-0"
            >
              {Array.from({ length: 4 }, (_, column) => (
                <Shape
                  key={column}
                  className={cn('h-4', column === 0 ? 'w-4/5' : 'w-2/3')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton({
  variant = 'table',
  label = 'Loading content',
  showHeading = true,
}: {
  variant?: Variant
  label?: string
  showHeading?: boolean
}) {
  return (
    <section
      role="status"
      aria-label={label}
      aria-busy="true"
      className="admin-loading-reveal space-y-6"
    >
      <span className="sr-only">{label}</span>
      {showHeading ? (
        <div className="space-y-3">
          <Shape className="h-3 w-28" />
          <Shape className="h-8 w-56 max-w-full" />
          <Shape className="h-4 w-80 max-w-full" />
        </div>
      ) : null}

      {variant === 'dashboard' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <Shape className="h-3 w-24" />
                <Shape className="mt-4 h-8 w-32" />
                <Shape className="mt-3 h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
            <Shape className="h-[300px] w-full rounded-2xl" />
            <Shape className="h-[300px] w-full rounded-2xl" />
          </div>
        </>
      ) : variant === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-line bg-white p-3"
            >
              <Shape className="aspect-square w-full" />
              <Shape className="mt-3 h-4 w-3/4" />
              <Shape className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : variant === 'form' ? (
        <div className="max-w-3xl space-y-5 rounded-2xl border border-line bg-white p-6">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Shape className="h-3 w-28" />
              <Shape className="h-11 w-full" />
            </div>
          ))}
          <Shape className="h-10 w-32" />
        </div>
      ) : variant === 'detail' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <Shape className="h-36 w-full rounded-2xl" />
            <Shape className="h-52 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Shape className="h-40 w-full rounded-2xl" />
            <Shape className="h-36 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <TableSkeleton />
      )}
    </section>
  )
}
