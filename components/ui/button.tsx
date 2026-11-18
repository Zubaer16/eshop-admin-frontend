import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { LoaderCircle } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
        secondary: 'bg-white text-ink border border-line hover:bg-slate-50',
        ghost: 'text-muted hover:bg-slate-100 hover:text-ink',
        danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    busy?: boolean
    pendingLabel?: string
  }
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant,
    size,
    asChild = false,
    className,
    busy = false,
    pendingLabel,
    disabled,
    children,
    'aria-busy': ariaBusy,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot : 'button'
  const busyText = pendingLabel ?? 'Saving…'
  const content =
    (busy || pendingLabel !== undefined) && !asChild ? (
      <span className="inline-grid place-items-center align-middle">
        <span
          className={cn(
            '[grid-area:1/1] inline-flex items-center justify-center',
            busy && 'invisible',
          )}
          aria-hidden={busy || undefined}
        >
          {children}
        </span>
        <span
          className={cn(
            '[grid-area:1/1] inline-flex items-center justify-center gap-2',
            !busy && 'invisible',
          )}
          aria-hidden={!busy || undefined}
        >
          <LoaderCircle
            aria-hidden="true"
            size={16}
            className="animate-spin motion-reduce:animate-none"
          />
          {busyText}
        </span>
      </span>
    ) : (
      children
    )

  return (
    <Component
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={busy || disabled}
      aria-busy={busy || ariaBusy || undefined}
      {...props}
    >
      {content}
    </Component>
  )
})
