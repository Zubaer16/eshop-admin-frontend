type SessionUser = {
  id: string
  role: string
  staffRole: string | null
  permissions: string[]
}
type Session = {
  status: 'anonymous' | 'checking' | 'authenticated'
  user: SessionUser | null
  epoch: number
}

export type Query = Record<string, string | number | boolean | undefined>
type Entry = {
  route: string
  value?: unknown
  expires: number
  pending?: Promise<unknown>
}
type CacheOptions = {
  session: () => Session
  request: (route: string, query: Query) => Promise<unknown>
  now?: () => number
  limit?: number
}

const segment = '[a-zA-Z0-9_-]{1,100}'
const cacheRules: readonly [RegExp, number][] = [
  [/^\/v1\/admin\/dashboard\/overview$/, 10_000],
  [/^\/v1\/admin\/orders$/, 5_000],
  [new RegExp(`^/v1/admin/inventory(?:/${segment}(?:/movements)?)?$`), 5_000],
  [new RegExp(`^/v1/admin/products(?:/${segment})?$`), 20_000],
  [/^\/v1\/admin\/categories$/, 30_000],
  [/^\/v1\/admin\/checkout\/(?:rates|zones|defaults)$/, 20_000],
  [/^\/v1\/admin\/media$/, 20_000],
  [/^\/v1\/admin\/promotions\/(?:coupons|campaigns)$/, 20_000],
  [/^\/v1\/admin\/store\/(?:banners|collections)$/, 20_000],
  [/^\/v1\/admin\/push\/campaigns$/, 10_000],
]

export function adminOwner(session: Session): string | null {
  const user = session.user
  if (session.status !== 'authenticated' || !user || user.role === 'CUSTOMER')
    return null
  return JSON.stringify([
    session.epoch,
    user.id,
    user.role,
    user.staffRole,
    [...user.permissions].sort(),
  ])
}

export function adminQueryKey(query: Query = {}) {
  return JSON.stringify(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  )
}

function copy<T>(value: T): T {
  return structuredClone(value)
}

export function createAdminCache({
  session,
  request,
  now = Date.now,
  limit = 40,
}: CacheOptions) {
  let owner: string | null = null
  let version = 0
  let invalidationVersion = 0
  const entries = new Map<string, Entry>()
  const listeners = new Set<() => void>()

  function publish(invalidated = false) {
    version++
    if (invalidated) invalidationVersion++
    listeners.forEach((listener) => listener())
  }

  function ttl(route: string) {
    return cacheRules.find(([pattern]) => pattern.test(route))?.[1] ?? 0
  }

  function key(route: string, query: Query = {}) {
    return JSON.stringify([route, adminQueryKey(query)])
  }

  function touch(cacheKey: string, entry: Entry) {
    entries.delete(cacheKey)
    entries.set(cacheKey, entry)
    while (entries.size > limit) entries.delete(entries.keys().next().value!)
  }

  function syncSession() {
    const next = adminOwner(session())
    if (next !== owner) {
      owner = next
      entries.clear()
      publish(true)
    }
    return owner
  }

  function guard(ticket: string) {
    if (syncSession() !== ticket)
      throw new Error(
        'The admin session or permissions changed. Reload this page.',
      )
  }

  function peek<T>(route: string, query: Query = {}): T | null {
    if (!ttl(route)) return null
    const current = adminOwner(session())
    if (!current || current !== owner) return null
    const cacheKey = key(route, query)
    const entry = entries.get(cacheKey)
    if (!entry || entry.value === undefined) return null
    touch(cacheKey, entry)
    return copy(entry.value) as T
  }

  function isPending(route: string, query: Query = {}) {
    return Boolean(entries.get(key(route, query))?.pending)
  }

  function read<T>(
    route: string,
    query: Query = {},
    force = false,
  ): Promise<T> {
    const lifetime = ttl(route)
    if (!lifetime) return request(route, query) as Promise<T>

    const ticket = syncSession()
    if (!ticket) return Promise.reject(new Error('Please sign in to continue.'))

    const cacheKey = key(route, query)
    const existing = entries.get(cacheKey)
    if (existing?.pending) return existing.pending as Promise<T>
    if (!force && existing?.value !== undefined && existing.expires > now()) {
      touch(cacheKey, existing)
      return Promise.resolve(copy(existing.value) as T)
    }

    const entry: Entry = existing ?? { route, expires: 0 }
    entry.pending = undefined
    const pending = Promise.resolve()
      .then(() => {
        guard(ticket)
        return request(route, query)
      })
      .then((value) => {
        guard(ticket)
        if (entries.get(cacheKey) !== entry)
          throw new Error('This cached request was superseded. Please retry.')
        entry.value = copy(value)
        entry.expires = now() + lifetime
        entry.pending = undefined
        touch(cacheKey, entry)
        publish()
        return copy(value) as T
      })
      .catch((error) => {
        if (entries.get(cacheKey) === entry) {
          if (entry.value === undefined) entries.delete(cacheKey)
          else {
            entry.pending = undefined
            touch(cacheKey, entry)
          }
          publish()
        }
        throw error
      })

    entry.pending = pending
    touch(cacheKey, entry)
    publish()
    return pending
  }

  function prefetch(route: string, query: Query = {}) {
    if (ttl(route) && syncSession())
      void read(route, query).catch(() => undefined)
  }

  function invalidateAll() {
    // Keep old values visible while replacing their in-flight requests with fresh reads.
    for (const [cacheKey, entry] of entries) {
      entries.set(cacheKey, {
        route: entry.route,
        value: entry.value,
        expires: 0,
      })
    }
    publish(true)
  }

  return {
    isCacheable: (route: string) => ttl(route) > 0,
    ttl,
    key,
    peek,
    read,
    prefetch,
    isPending,
    invalidateAll,
    syncSession,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getVersion: () => version,
    getServerVersion: () => 0,
    getInvalidationVersion: () => invalidationVersion,
    getServerInvalidationVersion: () => 0,
  }
}
