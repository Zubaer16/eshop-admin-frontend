type VisibilityTarget = Pick<
  Document,
  'visibilityState' | 'addEventListener' | 'removeEventListener'
>
type FocusTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>
type IntervalHandle = ReturnType<typeof setInterval>
type IdentityRevalidationOptions = {
  focusTarget?: FocusTarget
  schedule?: (callback: () => void, delay: number) => IntervalHandle
  cancel?: (handle: IntervalHandle) => void
  now?: () => number
  focusCooldownMs?: number
}

/** Revalidate on tab return/focus and periodically, coalescing nearby browser events. */
export function bindAdminIdentityRevalidation(
  refresh: () => Promise<unknown>,
  target: VisibilityTarget,
  options: IdentityRevalidationOptions = {},
) {
  const schedule = options.schedule ?? setInterval
  const cancel = options.cancel ?? clearInterval
  const now = options.now ?? Date.now
  const focusCooldownMs = options.focusCooldownMs ?? 15_000
  let wasHidden = target.visibilityState === 'hidden'
  let lastCheckAt = now()

  const check = (force = false) => {
    if (target.visibilityState !== 'visible') return
    const timestamp = now()
    if (!force && timestamp - lastCheckAt < focusCooldownMs) return
    lastCheckAt = timestamp
    void refresh().catch(() => undefined)
  }

  const handleVisibilityChange = () => {
    if (target.visibilityState === 'hidden') {
      wasHidden = true
      return
    }
    if (!wasHidden) return
    wasHidden = false
    check(true)
  }
  const handleFocus = () => check()

  target.addEventListener('visibilitychange', handleVisibilityChange)
  options.focusTarget?.addEventListener('focus', handleFocus)
  const timer = schedule(check, 60_000)

  return () => {
    target.removeEventListener('visibilitychange', handleVisibilityChange)
    options.focusTarget?.removeEventListener('focus', handleFocus)
    cancel(timer)
  }
}
