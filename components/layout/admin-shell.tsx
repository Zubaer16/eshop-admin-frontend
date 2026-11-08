'use client'
import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Layers3,
  Boxes,
  ShoppingCart,
  Users,
  Menu,
  X,
  ChevronRight,
  Bell,
  Globe2,
  ShieldCheck,
  RotateCcw,
  BadgePercent,
  Images,
  Truck,
  CreditCard,
  UserRoundCog,
  Settings2,
  ClipboardList,
  ChartNoAxesCombined,
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { isPreviewMode } from '@/lib/integration-mode'
import { canVisit } from '@/lib/admin-access'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'
import { useAdminStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { QuickNavigation } from './quick-navigation'
const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  ...(!isPreviewMode
    ? [{ href: '/media', label: 'Media library', icon: Images }]
    : []),
  { href: '/categories', label: 'Categories', icon: Layers3 },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/promotions', label: 'Promotions', icon: BadgePercent },
  { href: '/content', label: 'Store content', icon: Images },
  { href: '/shipping', label: 'Shipping & taxes', icon: Truck },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { href: '/alignment', label: 'Compatibility review', icon: ClipboardList },
  { href: '/staff', label: 'Staff & roles', icon: UserRoundCog },
  { href: '/settings', label: 'Store settings', icon: Settings2 },
  { href: '/activity', label: 'Activity preview', icon: ClipboardList },
]
function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-xl font-black text-white shadow-[0_7px_17px_rgba(36,89,232,.22)]">
        E
      </span>
      <span>
        <span className="block text-base font-black tracking-tight text-ink">
          eShop<span className="text-primary">.</span>
        </span>
        <span className="block text-[10px] font-bold tracking-[.18em] text-muted">
          ADMIN WORKSPACE
        </span>
      </span>
    </Link>
  )
}
function Sidebar({ close }: { close?: () => void }) {
  const pathname = usePathname()
  const { session } = useAuth()
  const visibleLinks = isPreviewMode
    ? links
    : links.filter((link) => canVisit(link.href, session.user))
  const reset = useAdminStore((s) => s.resetPreview)
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white px-5 py-6">
      <Logo />
      <div className="mt-11 px-3 text-[11px] font-extrabold uppercase tracking-[.18em] text-slate-400">
        Workspace
      </div>
      <nav aria-label="Admin navigation" className="mt-3 space-y-1.5">
        {visibleLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              onClick={close}
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition',
                active
                  ? 'bg-blue-50 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-ink',
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
              <span>{label}</span>
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-line pt-5">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <ShieldCheck size={19} className="text-primary" />
          <p className="mt-2 text-xs font-extrabold">
            {isPreviewMode ? 'Frontend preview' : 'Signed-in workspace'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {isPreviewMode
              ? 'Changes are saved in this browser only. No backend or payment is connected.'
              : 'Your identity and permissions come from the store. Data sections are being connected separately.'}
          </p>
        </div>
        {isPreviewMode && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => {
              if (window.confirm('Reset all local preview changes?')) reset()
            }}
          >
            <RotateCcw size={15} />
            Reset sample data
          </Button>
        )}
      </div>
    </div>
  )
}
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const visibleLinks = isPreviewMode
    ? links
    : links.filter((link) => canVisit(link.href, session.user))
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onResize = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }
    desktop.addEventListener('change', onResize)
    return () => desktop.removeEventListener('change', onResize)
  }, [])
  return (
    <div className="min-h-screen lg:pl-[254px]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-primary focus:shadow-xl"
      >
        Skip to main content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[254px] border-r border-line bg-white lg:block">
        <Sidebar />
      </aside>
      <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-8">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(84vw,280px)] overflow-hidden bg-white shadow-2xl focus:outline-none lg:hidden">
              <Dialog.Title className="sr-only">Admin navigation</Dialog.Title>
              <Dialog.Description className="sr-only">
                Choose a section of the admin preview workspace.
              </Dialog.Description>
              <Sidebar close={() => setOpen(false)} />
              <Dialog.Close
                aria-label="Close navigation"
                className="absolute right-3 top-4 rounded-lg bg-white p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <div className="hidden items-center gap-2 text-sm text-muted sm:flex">
          <Globe2 size={16} aria-hidden="true" />
          <span>Global Store</span>
          <ChevronRight size={14} aria-hidden="true" />
          <span
            className="font-bold capitalize text-ink"
            aria-current="location"
          >
            {links.find(({ href }) => pathname === href)?.label ??
              pathname.split('/')[1] ??
              'Overview'}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <QuickNavigation links={visibleLinks} />
          <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">
            USD only
          </span>
          <button
            type="button"
            aria-label="Notifications unavailable in preview"
            title="Notifications will be connected to the backend later"
            disabled
            className="rounded-xl border border-line p-2 text-muted opacity-50"
          >
            <Bell size={19} />
          </button>
          <div
            className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
            aria-label={
              isPreviewMode
                ? 'Admin preview profile'
                : 'Signed-in staff profile'
            }
            title={isPreviewMode ? undefined : session.user?.email}
          >
            {isPreviewMode
              ? 'AD'
              : session.user?.email.slice(0, 2).toUpperCase()}
          </div>
          {!isPreviewMode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void api.signOut()
              }}
            >
              Sign out
            </Button>
          )}
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1550px] px-4 pb-14 pt-7 sm:px-8 sm:pt-9"
      >
        {children}
      </main>
    </div>
  )
}
