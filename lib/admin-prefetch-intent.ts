type TimerHandle = ReturnType<typeof setTimeout>

/** Debounce pointer/keyboard intent so passing over many links does not fan out requests. */
export function createAdminPrefetchIntent(
  schedule: (callback: () => void, delay: number) => TimerHandle = setTimeout,
  cancel: (timer: TimerHandle) => void = clearTimeout,
) {
  let timer: TimerHandle | null = null

  return {
    schedule(callback: () => void, delay = 250) {
      if (timer !== null) cancel(timer)
      timer = schedule(() => {
        timer = null
        callback()
      }, delay)
    },
    cancel() {
      if (timer !== null) cancel(timer)
      timer = null
    },
  }
}
