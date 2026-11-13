'use client'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api/client'
import { categoryLabel, type Category } from '@/lib/api/catalog'
import { Button } from '@/components/ui/button'
import { Field, controlClass } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Panel } from '@/components/ui/panel'
import { PageHeading } from '@/components/layout/page-heading'
import { ErrorMessage, ResourceState, message, useResource } from './shared'
export function Categories() {
  const resource = useResource<Category[]>('/v1/admin/categories')
  const [editing, setEditing] = useState<Category | null | undefined>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('')
  const canWrite = api.can('catalog.manage')
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
        description="Manage the canonical category hierarchy and navigation visibility."
        action={
          canWrite ? (
            <Button disabled={busy} onClick={() => setEditing(null)}>
              Add category
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
      <Panel>
        {!resource.data ? (
          <ResourceState error={resource.error} retry={resource.reload} />
        ) : (
          <div className="divide-y divide-line">
            {!resource.data.length && (
              <p className="p-8 text-muted">No categories yet.</p>
            )}
            {resource.data.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <h2 className="font-bold">
                    {categoryLabel(item, resource.data!)}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {item.slug} · {item.active ? 'Visible' : 'Hidden'} · Order{' '}
                    {item.sortOrder}
                  </p>
                </div>
                {canWrite && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setEditing(item)}
                    >
                      Edit {item.name}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={busy}
                      onClick={() => void remove(item)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
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
        <Button type="submit">{busy ? 'Saving…' : 'Save category'}</Button>
      </fieldset>
    </form>
  )
}
