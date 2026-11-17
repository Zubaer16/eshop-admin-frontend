const listeners = new Set<() => void>()

export function subscribeAdminMutations(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyAdminMutation() {
  listeners.forEach((listener) => listener())
}
