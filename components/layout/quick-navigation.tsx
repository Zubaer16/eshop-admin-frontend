'use client'

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { usePathname } from 'next/navigation'
import { useNavigationRouter } from '@/components/layout/navigation-provider'
import { ArrowRight, Search, X } from 'lucide-react'
import { prefetchAdminRoute } from '@/lib/admin-cache'

type NavigationLink = { href: string; label: string }

export function QuickNavigation({
  links,
}: {
  links: readonly NavigationLink[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const pathname = usePathname()
  const router = useNavigationRouter()
  const matches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    return links.filter((link) =>
      `${link.label} ${link.href.replaceAll('/', ' ')}`
        .toLocaleLowerCase()
        .includes(term),
    )
  }, [links, query])

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  // Close after navigation, including navigation initiated outside this dialog.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  function changeOpen(next: boolean) {
    if (next) {
      setQuery('')
      setActiveIndex(0)
    }
    setOpen(next)
  }
  function prefetch(href: string) {
    router.prefetch(href)
    prefetchAdminRoute(href)
  }
  function navigate(href: string) {
    prefetch(href)
    setOpen(false)
    router.push(href)
  }
  function onSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (matches.length) {
        const nextIndex =
          (activeIndex +
            (event.key === 'ArrowDown' ? 1 : -1) +
            matches.length) %
          matches.length
        setActiveIndex(nextIndex)
        prefetch(matches[nextIndex].href)
      }
    } else if (event.key === 'Enter' && matches[activeIndex]) {
      event.preventDefault()
      navigate(matches[activeIndex].href)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Jump to section"
          aria-keyshortcuts="Control+K Meta+K"
          className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-muted transition hover:bg-slate-50 hover:text-ink"
        >
          <Search size={17} aria-hidden="true" />
          <span className="hidden text-xs font-semibold md:inline">
            Jump to section
          </span>
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold lg:inline">
            Ctrl K
          </kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-950/45" />
        <Dialog.Content className="fixed left-1/2 top-[min(13vh,110px)] z-[80] flex max-h-[min(78dvh,650px)] w-[min(calc(100vw-1.5rem),620px)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-extrabold text-ink">
                Jump to section
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-muted">
                Type a section name, use arrow keys, then press Enter.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close quick navigation"
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="px-4 py-3">
            <label
              className="block text-xs font-bold text-muted"
              htmlFor="admin-quick-search"
            >
              Find an admin page
            </label>
            <input
              id="admin-quick-search"
              autoFocus
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls="admin-quick-results"
              aria-activedescendant={
                matches[activeIndex]
                  ? `admin-quick-item-${matches[activeIndex].href.slice(1)}`
                  : undefined
              }
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search dashboard, inventory, reports…"
              className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div
            id="admin-quick-results"
            role="listbox"
            aria-label="Admin sections"
            className="overflow-y-auto px-3 pb-4"
          >
            {matches.length ? (
              matches.map((link, index) => (
                <button
                  type="button"
                  role="option"
                  id={`admin-quick-item-${link.href.slice(1)}`}
                  key={link.href}
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => {
                    setActiveIndex(index)
                    prefetch(link.href)
                  }}
                  onFocus={() => prefetch(link.href)}
                  onTouchStart={() => prefetch(link.href)}
                  onClick={() => navigate(link.href)}
                  className={`flex min-h-11 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary ${index === activeIndex ? 'bg-blue-50 text-primary' : 'text-ink hover:bg-slate-50'}`}
                >
                  <span>{link.label}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ))
            ) : (
              <p
                className="px-4 py-7 text-center text-sm text-muted"
                role="status"
              >
                No matching sections. Try a different name.
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
