type VisibilityTarget = Pick<
  Document,
  'visibilityState' | 'addEventListener' | 'removeEventListener'
>
type ActiveRefreshCache = { invalidateActive: () => void }

/** Revalidate mounted resources only after the document was actually hidden. */
export function bindAdminCacheVisibilityRefresh(
  cache: ActiveRefreshCache,
  target: VisibilityTarget,
) {
  let wasHidden = target.visibilityState === 'hidden'

  const handleVisibilityChange = () => {
    if (target.visibilityState === 'hidden') {
      wasHidden = true
      return
    }
    if (!wasHidden) return
    wasHidden = false
    cache.invalidateActive()
  }

  target.addEventListener('visibilitychange', handleVisibilityChange)
  return () =>
    target.removeEventListener('visibilitychange', handleVisibilityChange)
}
