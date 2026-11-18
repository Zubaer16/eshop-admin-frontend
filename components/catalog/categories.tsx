'use client'
import { useMemo, useState, type FormEvent } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { categoryLabel, type Category } from '@/lib/api/catalog'
import {
  buildCategoryTree,
  categoryTreeIdsWithChildren,
  filterCategoryTree,
  type FilteredCategoryTreeNode,
} from '@/lib/category-tree'
import { Button } from '@/components/ui/button'
import { Field, controlClass } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Panel } from '@/components/ui/panel'
import { PageHeading } from '@/components/layout/page-heading'
import { ErrorMessage, ResourceState, message, useResource } from './shared'

function CategoryTreeRow({
  node,
  level,
  collapsed,
  forceExpanded,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  node: FilteredCategoryTreeNode
  level: number
  collapsed: Set<string>
  forceExpanded: boolean
  busy: boolean
  onToggle: (id: string) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}) {
  const { category, children, matched } = node
  const hasChildren = children.length > 0
  const expanded = forceExpanded || !collapsed.has(category.id)
  const indent = Math.min(level, 6) * 20

  return (
    <div className="category-tree-node" data-category-id={category.id}>
      <div
        className={[
          'group flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0 sm:px-5',
          matched
            ? 'bg-white hover:bg-slate-50/80'
            : 'bg-slate-50/70 hover:bg-slate-50',
        ].join(' ')}
      >
        <div
          className="flex min-w-0 flex-1 items-center gap-2.5"
          style={{ paddingLeft: indent }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink"
              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`}
              aria-expanded={expanded}
              onClick={() => onToggle(category.id)}
            >
              {expanded ? (
                <ChevronDown size={17} />
              ) : (
                <ChevronRight size={17} />
              )}
            </button>
          ) : (
            <span className="h-8 w-8 shrink-0" aria-hidden="true" />
          )}
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-primary">
            {hasChildren && expanded ? (
              <FolderOpen size={18} />
            ) : (
              <Folder size={18} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="truncate text-sm font-bold text-ink"
                title={category.name}
              >
                {category.name}
              </h2>
              {!matched && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Parent context
                </span>
              )}
              {hasChildren && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  {children.length}{' '}
                  {children.length === 1 ? 'child' : 'children'} shown
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
              <span className="truncate" title={category.slug}>
                {category.slug}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${category.active ? 'text-emerald-700' : 'text-slate-500'}`}
              >
                {category.active ? <Eye size={12} /> : <EyeOff size={12} />}
                {category.active ? 'Visible' : 'Hidden'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Sort order {category.sortOrder}</span>
              {category.parentId && (
                <span className="sm:hidden">· Subcategory</span>
              )}
            </div>
          </div>
        </div>

        <div className="ml-10 flex shrink-0 items-center gap-1.5 sm:ml-0">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-lg"
            disabled={busy}
            aria-label={`Edit ${category.name}`}
            title={`Edit ${category.name}`}
            onClick={() => onEdit(category)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="danger"
            size="icon"
            className="h-9 w-9 rounded-lg"
            disabled={busy}
            aria-label={`Delete ${category.name}`}
            title={`Delete ${category.name}`}
            onClick={() => onDelete(category)}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="category-tree-children">
          {children.map((child) => (
            <CategoryTreeRow
              key={child.category.id}
              node={child}
              level={level + 1}
              collapsed={collapsed}
              forceExpanded={forceExpanded}
              busy={busy}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Categories() {
  const resource = useResource<Category[]>('/v1/admin/categories')
  const [editing, setEditing] = useState<Category | null | undefined>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [search, setSearch] = useState(''),
    [visibility, setVisibility] = useState<'all' | 'visible' | 'hidden'>('all'),
    [level, setLevel] = useState<'all' | 'root' | 'child'>('all'),
    [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())

  const canWrite = api.can('catalog.manage')
  const categories = useMemo(() => resource.data ?? [], [resource.data])
  const tree = useMemo(() => buildCategoryTree(categories), [categories])
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredTree = useMemo(
    () =>
      filterCategoryTree(tree, (category) => {
        const matchesSearch =
          !normalizedSearch ||
          [category.name, category.slug, category.description].some((value) =>
            value.toLocaleLowerCase().includes(normalizedSearch),
          )
        const matchesVisibility =
          visibility === 'all' ||
          (visibility === 'visible' ? category.active : !category.active)
        const matchesLevel =
          level === 'all' ||
          (level === 'root'
            ? category.parentId === null
            : category.parentId !== null)
        return matchesSearch && matchesVisibility && matchesLevel
      }),
    [tree, normalizedSearch, visibility, level],
  )
  const roots = categories.filter(
    (category) => category.parentId === null,
  ).length
  const visibleCount = categories.filter((category) => category.active).length
  const hiddenCount = categories.length - visibleCount
  const expandableIds = useMemo(() => categoryTreeIdsWithChildren(tree), [tree])
  const hasFilters =
    Boolean(normalizedSearch) || visibility !== 'all' || level !== 'all'

  function toggleCategory(id: string) {
    setCollapsed((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setCollapsed(new Set())
  }

  function collapseAll() {
    setCollapsed(new Set(expandableIds))
  }

  async function remove(item: Category) {
    if (
      !window.confirm(
        `Delete category “${item.name}”? Products and child categories must be detached first.`,
      )
    )
      return
    setBusy(true)
    setError('')
    try {
      await api.request('/v1/admin/categories/' + item.id, { method: 'DELETE' })
      setNotice('Category deleted.')
      resource.reload()
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="CATALOG MANAGEMENT"
        title="Categories"
        description="Manage your category hierarchy, visibility and navigation order."
        action={
          canWrite ? (
            <Button disabled={busy} onClick={() => setEditing(null)}>
              <Plus size={16} /> Add category
            </Button>
          ) : undefined
        }
      />
      <ErrorMessage text={error} />
      {notice && (
        <p role="status" className="mb-4 text-sm text-primary">
          {notice}
        </p>
      )}

      {!resource.data ? (
        <Panel className="p-5">
          <ResourceState error={resource.error} retry={resource.reload} />
        </Panel>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <CategoryMetric
              label="Total categories"
              value={categories.length}
              icon={<FolderTree size={17} />}
            />
            <CategoryMetric
              label="Visible"
              value={visibleCount}
              icon={<Eye size={17} />}
              tone="success"
            />
            <CategoryMetric
              label="Hidden"
              value={hiddenCount}
              icon={<EyeOff size={17} />}
              tone="muted"
            />
            <CategoryMetric
              label="Top-level"
              value={roots}
              icon={<Folder size={17} />}
            />
          </div>

          <Panel className="overflow-hidden">
            <div className="space-y-4 border-b border-line p-4 sm:p-5">
              <div className="grid gap-2 lg:grid-cols-[minmax(240px,1fr)_190px_190px]">
                <label className="relative block min-w-0">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className={controlClass + ' pl-10 pr-10'}
                    aria-label="Search categories"
                    placeholder="Search name, slug or description..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="Clear category search"
                      className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-slate-100"
                      onClick={() => setSearch('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <select
                  className={controlClass}
                  aria-label="Filter category visibility"
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as typeof visibility)
                  }
                >
                  <option value="all">All visibility</option>
                  <option value="visible">Visible only</option>
                  <option value="hidden">Hidden only</option>
                </select>
                <select
                  className={controlClass}
                  aria-label="Filter category level"
                  value={level}
                  onChange={(event) =>
                    setLevel(event.target.value as typeof level)
                  }
                >
                  <option value="all">All levels</option>
                  <option value="root">Top-level only</option>
                  <option value="child">Subcategories only</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p
                  className="text-xs font-semibold text-muted"
                  aria-live="polite"
                >
                  {hasFilters
                    ? `${countFiltered(filteredTree)} matching categories · ${categories.length} total`
                    : `${categories.length} categories · ${roots} top-level`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={expandAll}
                    disabled={!expandableIds.length}
                  >
                    <ChevronsUpDown size={15} /> Expand all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={collapseAll}
                    disabled={!expandableIds.length}
                  >
                    <ChevronsDownUp size={15} /> Collapse all
                  </Button>
                </div>
              </div>
            </div>

            <section aria-label="Category hierarchy" className="divide-y-0">
              {!filteredTree.length ? (
                <div className="px-6 py-14 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                    <Search size={21} />
                  </span>
                  <h2 className="mt-3 text-sm font-bold text-ink">
                    No categories found
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Try another search or clear the selected filters.
                  </p>
                  {hasFilters && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setSearch('')
                        setVisibility('all')
                        setLevel('all')
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                filteredTree.map((node) => (
                  <CategoryTreeRow
                    key={node.category.id}
                    node={node}
                    level={0}
                    collapsed={collapsed}
                    forceExpanded={hasFilters}
                    busy={busy}
                    onToggle={toggleCategory}
                    onEdit={setEditing}
                    onDelete={(category) => void remove(category)}
                  />
                ))
              )}
            </section>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-slate-50/70 px-4 py-3 text-xs text-muted sm:px-5">
              <span>Category hierarchy · Ordered by sort order</span>
              <span>
                {visibleCount} visible · {hiddenCount} hidden
              </span>
            </div>
          </Panel>
        </div>
      )}

      <Modal
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined)
        }}
        title={editing ? 'Edit category' : 'Add category'}
      >
        {editing !== undefined && (
          <CategoryForm
            key={editing?.id || 'new'}
            initial={editing}
            categories={resource.data || []}
            saved={() => {
              setEditing(undefined)
              resource.reload()
              setNotice('Category saved.')
            }}
          />
        )}
      </Modal>
    </>
  )
}

function countFiltered(nodes: FilteredCategoryTreeNode[]): number {
  return nodes.reduce(
    (total, node) =>
      total + (node.matched ? 1 : 0) + countFiltered(node.children),
    0,
  )
}

function CategoryMetric({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone?: 'default' | 'success' | 'muted'
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'muted'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-blue-50 text-primary'
  return (
    <Panel className="flex items-center gap-3 p-3.5 sm:p-4">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-muted">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold tabular-nums text-ink">
          {value}
        </p>
      </div>
    </Panel>
  )
}

function CategoryForm({
  initial,
  categories,
  saved,
}: {
  initial: Category | null
  categories: Category[]
  saved: () => void
}) {
  const [name, setName] = useState(initial?.name || ''),
    [slug, setSlug] = useState(initial?.slug || ''),
    [description, setDescription] = useState(initial?.description || ''),
    [parentId, setParentId] = useState(initial?.parentId || ''),
    [color, setColor] = useState(initial?.color || '#EAF0FF'),
    [sortOrder, setSortOrder] = useState(initial?.sortOrder || 0),
    [active, setActive] = useState(initial?.active ?? true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.request(
        '/v1/admin/categories' + (initial ? '/' + initial.id : ''),
        {
          method: initial ? 'PATCH' : 'POST',
          body: {
            name: name.trim(),
            slug,
            description,
            parentId: parentId || null,
            color,
            sortOrder,
            active,
          },
        },
      )
      saved()
    } catch (error) {
      setError(
        message(error) +
          ' Reload the list before repeating an uncertain create.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <Field label="Category name">
          <input
            className={controlClass}
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Canonical slug">
          <input
            className={controlClass}
            required
            maxLength={160}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={controlClass + ' h-24 py-2'}
            maxLength={3000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Parent category">
          <select
            className={controlClass}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">Top level</option>
            {categories
              .filter((c) => c.id !== initial?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c, categories)}
                </option>
              ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tile color">
            <input
              type="color"
              className={controlClass}
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              required
              min={0}
              max={1000000}
              className={controlClass}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </Field>
        </div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Visible in navigation
        </label>
        <ErrorMessage text={error} />
        <Button type="submit" busy={busy} pendingLabel="Saving category…">
          Save category
        </Button>
      </fieldset>
    </form>
  )
}
