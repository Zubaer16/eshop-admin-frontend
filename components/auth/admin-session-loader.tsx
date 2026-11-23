/**
 * Neutral, public-only loading surface while the Admin session is restored or
 * an unauthenticated visitor is being routed to sign-in. Never mount the
 * private AdminShell until RequireAuth has accepted the current session.
 */
export function AdminSessionLoader() {
  return (
    <main
      role="status"
      aria-label="Preparing your workspace"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-5 py-12 text-center"
    >
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-black text-white shadow-[0_7px_17px_rgba(36,89,232,.22)]">
          E
        </span>
        <span className="text-left">
          <span className="block text-xl font-black tracking-tight text-ink">
            eShop<span className="text-primary">.</span>
          </span>
          <span className="block text-[10px] font-bold tracking-[.18em] text-muted">
            ADMIN WORKSPACE
          </span>
        </span>
      </div>
      <span
        aria-hidden="true"
        className="mt-9 size-9 rounded-full border-[3px] border-blue-100 border-t-primary motion-safe:animate-spin"
      />
      <p className="mt-5 text-sm font-medium text-muted">
        Preparing your workspace…
      </p>
    </main>
  )
}
