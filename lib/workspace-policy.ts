/** Browser-only workspace policy previews. Never authorize a server request with these values. */
export const permissionCatalog = [
  { key: 'dashboard.view', label: 'View dashboard', group: 'Overview' },
  {
    key: 'catalog.manage',
    label: 'Manage products & categories',
    group: 'Catalog',
  },
  { key: 'inventory.adjust', label: 'Adjust stock', group: 'Catalog' },
  {
    key: 'orders.manage',
    label: 'Manage orders & returns',
    group: 'Operations',
  },
  { key: 'customers.view', label: 'View customers', group: 'Operations' },
  {
    key: 'marketing.manage',
    label: 'Manage promotions & content',
    group: 'Marketing',
  },
  {
    key: 'shipping.manage',
    label: 'Manage shipping & tax previews',
    group: 'Commerce',
  },
  {
    key: 'payments.view',
    label: 'View sample payment reports',
    group: 'Commerce',
  },
  {
    key: 'staff.manage',
    label: 'Manage staff & role previews',
    group: 'Workspace',
  },
  {
    key: 'settings.manage',
    label: 'Manage store settings preview',
    group: 'Workspace',
  },
  {
    key: 'activity.view',
    label: 'View local activity history',
    group: 'Workspace',
  },
] as const
export type PermissionKey = (typeof permissionCatalog)[number]['key']
export const staffRoles = [
  'Owner',
  'Manager',
  'Catalog Editor',
  'Support',
  'Analyst',
] as const
export type StaffRole = (typeof staffRoles)[number]
export type RolePermissions = Record<StaffRole, PermissionKey[]>
export const allPermissions = permissionCatalog.map((p) => p.key)
export const seedRolePermissions: RolePermissions = {
  Owner: [...allPermissions],
  Manager: allPermissions.filter((p) => p !== 'staff.manage'),
  'Catalog Editor': ['dashboard.view', 'catalog.manage', 'inventory.adjust'],
  Support: ['dashboard.view', 'orders.manage', 'customers.view'],
  Analyst: ['dashboard.view', 'payments.view', 'activity.view'],
}
export type StaffMember = {
  id: string
  name: string
  email: string
  role: StaffRole
  status: 'Active' | 'Suspended'
  createdAt: string
}
export const seedStaff: StaffMember[] = [
  {
    id: 'staff-owner',
    name: 'Store Owner (Sample)',
    email: 'owner@example.test',
    role: 'Owner',
    status: 'Active',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'staff-manager',
    name: 'Operations Manager (Sample)',
    email: 'operations@example.test',
    role: 'Manager',
    status: 'Active',
    createdAt: '2026-10-03T09:00:00Z',
  },
  {
    id: 'staff-editor',
    name: 'Catalog Editor (Sample)',
    email: 'catalog@example.test',
    role: 'Catalog Editor',
    status: 'Active',
    createdAt: '2026-10-06T09:00:00Z',
  },
]
export type StoreSettings = {
  storeName: string
  supportEmail: string
  websiteUrl: string
  timezone: string
  orderPrefix: string
  supportNotice: string
}
export const defaultStoreSettings: StoreSettings = {
  storeName: 'eShop',
  supportEmail: 'support@example.test',
  websiteUrl: '',
  timezone: 'UTC',
  orderPrefix: 'KB',
  supportNotice: '',
}
export const supportedTimezones = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Singapore',
  'Australia/Sydney',
] as const
export type ActivityEvent = {
  id: string
  at: string
  area: 'Staff' | 'Roles' | 'Settings'
  action: string
  detail: string
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function staffError(
  input: StaffMember,
  members: StaffMember[],
): string | null {
  if (input.name.trim().length < 2 || input.name.trim().length > 80)
    return 'Staff name must contain 2–80 characters.'
  if (!emailPattern.test(input.email.trim()) || input.email.trim().length > 120)
    return 'Enter a valid staff email address.'
  if (!staffRoles.includes(input.role)) return 'Choose a valid staff role.'
  if (!['Active', 'Suspended'].includes(input.status))
    return 'Choose a valid staff status.'
  if (
    members.some(
      (m) =>
        m.id !== input.id &&
        m.email.toLowerCase() === input.email.trim().toLowerCase(),
    )
  )
    return 'This staff email already exists.'
  if (
    input.id === 'staff-owner' &&
    (input.role !== 'Owner' || input.status !== 'Active')
  )
    return 'The sample owner must remain an active Owner.'
  return null
}
export function settingsError(value: StoreSettings): string | null {
  if (value.storeName.trim().length < 2 || value.storeName.trim().length > 70)
    return 'Store name must contain 2–70 characters.'
  if (
    !emailPattern.test(value.supportEmail.trim()) ||
    value.supportEmail.trim().length > 120
  )
    return 'Enter a valid support email.'
  if (
    value.websiteUrl &&
    (!/^https:\/\/[\w.-]+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(
      value.websiteUrl.trim(),
    ) ||
      value.websiteUrl.length > 200)
  )
    return 'Website URL must be a valid HTTPS address.'
  if (!(supportedTimezones as readonly string[]).includes(value.timezone))
    return 'Select a supported time zone.'
  if (!/^[A-Z0-9]{2,8}$/.test(value.orderPrefix.trim()))
    return 'Order prefix must be 2–8 uppercase letters or digits.'
  if (value.supportNotice.length > 180)
    return 'Support notice must be 180 characters or less.'
  return null
}
export function rolePermissionsError(
  role: StaffRole,
  permissions: PermissionKey[],
): string | null {
  if (!staffRoles.includes(role)) return 'Invalid role.'
  if (role === 'Owner') return 'Owner permissions are fixed in this preview.'
  if (
    permissions.some((p) => !allPermissions.includes(p)) ||
    new Set(permissions).size !== permissions.length
  )
    return 'Invalid or duplicate permissions.'
  return null
}
