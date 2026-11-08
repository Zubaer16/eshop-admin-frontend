'use client'
import { apiOrigin, createApiClient } from './runtime'
import {
  announceSession,
  createBrowserSession,
  sessionChannelName,
} from './browser-session'
export { sessionSource } from './browser-session'
export { ApiRequestError, safeReturnTo } from './runtime'
export function apiBaseUrl() {
  return apiOrigin(
    process.env.NEXT_PUBLIC_ESHOP_API_URL ??
      process.env.NEXT_PUBLIC_KOOKABURRA_API_URL,
    process.env.NODE_ENV === 'production',
  )
}
export const authChannelName = sessionChannelName('staff')
export const api = createApiClient({
  audience: 'staff',
  baseUrl: apiBaseUrl,
  session: createBrowserSession('staff'),
  onLogout: () => announceSession('staff', 'logout'),
  onLogin: () => announceSession('staff', 'login'),
})
export const apiRequest = api.request
