export type IntentPrefetchController = {
  schedule: (key: string, action: () => void) => void
  cancel: (key: string) => void
  run: (key: string, action: () => void) => void
  cancelAll: () => void
}

/**
 * Delays pointer-driven prefetch until the user pauses over a control.
 * Focus and touch callers can use run() for immediate, explicit intent.
 */
export function createIntentPrefetch(delayMs = 300): IntentPrefetchController {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const delay = Number.isFinite(delayMs)
    ? Math.max(0, Math.min(2_000, Math.floor(delayMs)))
    : 300

  function cancel(key: string) {
    const timer = timers.get(key)
    if (timer !== undefined) clearTimeout(timer)
    timers.delete(key)
  }

  function schedule(key: string, action: () => void) {
    cancel(key)
    const timer = setTimeout(() => {
      timers.delete(key)
      action()
    }, delay)
    timers.set(key, timer)
  }

  function run(key: string, action: () => void) {
    cancel(key)
    action()
  }

  function cancelAll() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }

  return { schedule, cancel, run, cancelAll }
}
