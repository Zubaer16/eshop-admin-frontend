'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Badge, statusKind } from '@/components/ui/badge'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api/client'
import {
  categoryLabel,
  minorFromInput,
  money,
  moneyInput,
  type Category,
  type Page,
  type Product,
  type Variant,
} from '@/lib/api/catalog'
import { Button } from '@/components/ui/button'
import { Field, controlClass } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Panel } from '@/components/ui/panel'
import { PageHeading } from '@/components/layout/page-heading'
import {
  ErrorMessage,
  Pagination,
  ResourceState,
  message,
  useResource,
} from './shared'
import { ProductMedia } from './media'
export function Products() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(''),
    [draftSearch, setDraftSearch] = useState(''),
    [category, setCategory] = useState(''),
    [status, setStatus] = useState('')
  const resource = useResource<Page<Product>>('/v1/admin/products', {
      page,
      limit: 20,
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
    }),
    categories = useResource<Category[]>('/v1/admin/categories')
  const [editing, setEditing] = useState<Product | null | undefined>(),
    [detailId, setDetailId] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false)
  const canWrite = api.can('catalog.manage')
  async function archive(product: Product) {
    if (
      !window.confirm(
        `Archive “${product.title}”? This removes it from the public catalog and detaches its gallery; unreferenced images enter retention cleanup.`,
      )
    )
      return
    setBusy(true)
    setError('')
    try {
      await api.request('/v1/admin/products/' + product.id, {
        method: 'DELETE',
      })
      resource.reload()
      setNotice('Product archived.')
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
        title="Products"
        description="Manage real products, SKU variants and publishing status."
        action={
          canWrite ? (
            <Button
              disabled={!categories.data?.length || busy}
              onClick={() => setEditing(null)}
            >
              Add product
            </Button>
          ) : undefined
        }
      />
      <Panel>
        <form
          className="flex flex-wrap gap-3 border-b border-line p-4"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setSearch(draftSearch)
          }}
        >
          <input
            aria-label="Search products"
            placeholder="Search product title"
            className={controlClass + ' max-w-xs'}
            maxLength={100}
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
          <select
            aria-label="Filter category"
            className={controlClass + ' w-auto'}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.slug}>
                {categoryLabel(c, categories.data!)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter product status"
            className={controlClass + ' w-auto'}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            {['DRAFT', 'ACTIVE', 'ARCHIVED'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <Button variant="ghost" type="button" onClick={resource.reload}>
            Refresh
          </Button>
        </form>
        <ErrorMessage text={error || categories.error} />
        {notice && (
          <p role="status" className="p-4 text-sm text-primary">
            {notice}
          </p>
        )}
        {!resource.data ? (
          <ResourceState error={resource.error} retry={resource.reload} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead className="bg-slate-50 text-xs text-muted">
                  <tr>
                    {[
                      'Product / SKU',
                      'Category',
                      'Price',
                      'Status',
                      'Stock',
                      'Variants',
                      'Badge',
                      'Actions',
                    ].map((x) => (
                      <th className="p-4" key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {resource.data.items.map((product) => (
                    <tr key={product.id}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.gallery[0] && (
                            <Image
                              unoptimized
                              src={product.gallery[0].url}
                              alt={product.gallery[0].alt || product.title}
                              width={44}
                              height={44}
                              className="size-11 rounded-lg border border-line object-cover"
                            />
                          )}
                          <p className="font-bold">{product.title}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted">{product.sku}</p>
                      </td>
                      <td className="p-4">
                        {product.categoryIds
                          .map(
                            (id) =>
                              categories.data?.find((row) => row.id === id)
                                ?.name || id,
                          )
                          .join(', ') || 'Uncategorized'}
                      </td>
                      <td className="p-4">
                        {money(product.priceMinor, product.currency)}
                      </td>
                      <td className="p-4">
                        <Badge kind={statusKind(product.status)}>
                          {product.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {product.hasVariants
                          ? `${product.variants.length} variants`
                          : product.stockOnHand + ' physical units'}
                      </td>
                      <td>{product.variants.length}</td>
                      <td>{product.badge || product.tag || 'None'}</td>
                      <td className="flex flex-wrap gap-2 p-4">
                        <Button
                          variant="secondary"
                          onClick={() => setDetailId(product.id)}
                        >
                          Details
                        </Button>
                        {canWrite && (
                          <>
                            <Button
                              variant="secondary"
                              onClick={() => setEditing(product)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              disabled={busy || product.status === 'ARCHIVED'}
                              onClick={() => void archive(product)}
                            >
                              Archive
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!resource.data.items.length && (
                <p className="p-8 text-muted">
                  No products match these filters.
                </p>
              )}
            </div>
            <Pagination data={resource.data} change={setPage} />
          </>
        )}
      </Panel>
      <Modal
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined)
        }}
        title={editing ? 'Edit product' : 'Add product'}
        wide
      >
        {editing !== undefined && (
          <ProductForm
            key={editing?.id || 'new'}
            initial={editing}
            categories={categories.data || []}
            saved={(id) => {
              setEditing(undefined)
              setDetailId(id)
              resource.reload()
              setNotice('Product saved.')
            }}
          />
        )}
      </Modal>
      <Modal
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId('')
            resource.reload()
          }
        }}
        title="Product details"
        wide
      >
        {detailId && (
          <ProductDetail key={detailId} id={detailId} canWrite={canWrite} />
        )}
      </Modal>
    </>
  )
}
function ProductForm({
  initial,
  categories,
  saved,
}: {
  initial: Product | null
  categories: Category[]
  saved: (id: string) => void
}) {
  const [title, setTitle] = useState(initial?.title || ''),
    [slug, setSlug] = useState(initial?.slug || ''),
    [sku, setSku] = useState(initial?.sku || ''),
    [description, setDescription] = useState(initial?.description || ''),
    [status, setStatus] = useState(initial?.status || 'DRAFT'),
    [price, setPrice] = useState(
      initial ? moneyInput(initial.priceMinor, initial.currency) : '',
    ),
    [compare, setCompare] = useState(
      initial?.compareAtMinor == null
        ? ''
        : moneyInput(initial.compareAtMinor, initial.currency),
    ),
    [ids, setIds] = useState(initial?.categoryIds || []),
    [stock, setStock] = useState(0),
    [tag, setTag] = useState(initial?.tag || ''),
    [badge, setBadge] = useState(initial?.badge || ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const currency = initial?.currency || 'USD'
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const priceMinor = minorFromInput(price, currency),
        compareAtMinor = compare ? minorFromInput(compare, currency) : null
      if (!ids.length || ids.length > 30)
        throw new Error('Choose between one and 30 categories.')
      if (compareAtMinor != null && compareAtMinor < priceMinor)
        throw new Error('Compare-at price cannot be below the selling price.')
      if (
        initial?.status !== 'ARCHIVED' &&
        status === 'ARCHIVED' &&
        !window.confirm(
          'Archiving detaches this product gallery and schedules unreferenced media cleanup. Continue?',
        )
      )
        return
      const result = await api.request<Product>(
        '/v1/admin/products' + (initial ? '/' + initial.id : ''),
        {
          method: initial ? 'PATCH' : 'POST',
          body: {
            title: title.trim(),
            slug,
            sku,
            description,
            status,
            currency,
            priceMinor,
            compareAtMinor,
            categoryIds: ids,
            badge,
            tag: tag || null,
            ...(!initial ? { stockOnHand: stock } : {}),
          },
        },
      )
      saved(result.id)
    } catch (error) {
      setError(
        message(error) +
          ' Check the current list before repeating an uncertain write.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product title">
            <input
              className={controlClass}
              required
              maxLength={250}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Canonical slug">
            <input
              className={controlClass}
              required
              maxLength={200}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Field>
          <Field label="Base SKU">
            <input
              className={controlClass}
              required
              maxLength={120}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </Field>
          <Field label="Publication status">
            <select
              className={controlClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as Product['status'])}
            >
              {['DRAFT', 'ACTIVE', 'ARCHIVED'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label={`Price (${currency})`}>
            <input
              className={controlClass}
              inputMode="decimal"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <Field label={`Compare-at price (${currency}, optional)`}>
            <input
              className={controlClass}
              inputMode="decimal"
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
            />
          </Field>
          <Field label="Badge">
            <input
              className={controlClass}
              maxLength={80}
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            />
          </Field>
          <Field label="Product tag">
            <select
              className={controlClass}
              value={tag}
              onChange={(e) => setTag(e.target.value as typeof tag)}
            >
              <option value="">None</option>
              {['new', 'popular', 'sale'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            maxLength={10000}
            className={controlClass + ' h-28 py-2'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <fieldset className="rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-bold">
            Categories (up to 30)
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((c) => (
              <label key={c.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ids.includes(c.id)}
                  onChange={(e) =>
                    setIds((previous) =>
                      e.target.checked
                        ? [...previous, c.id]
                        : previous.filter((id) => id !== c.id),
                    )
                  }
                />
                {categoryLabel(c, categories)}
              </label>
            ))}
          </div>
        </fieldset>
        {!initial && (
          <Field
            label="Initial physical stock"
            hint="Start at zero to add size/color variants; later stock changes use Inventory only."
          >
            <input
              type="number"
              className={controlClass}
              min={0}
              max={2147483647}
              required
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </Field>
        )}
        <ErrorMessage text={error} />
        <Button type="submit">{busy ? 'Saving…' : 'Save product'}</Button>
      </fieldset>
    </form>
  )
}
function ProductDetail({ id, canWrite }: { id: string; canWrite: boolean }) {
  const resource = useResource<Product>('/v1/admin/products/' + id)
  const [variant, setVariant] = useState<Variant | null | undefined>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  if (!resource.data)
    return <ResourceState error={resource.error} retry={resource.reload} />
  const product = resource.data
  async function remove(item: Variant) {
    if (
      !window.confirm(
        'Delete this zero-stock draft variant? Inventory history and order references can prevent deletion.',
      )
    )
      return
    setBusy(true)
    setError('')
    try {
      await api.request(`/v1/admin/products/${id}/variants/${item.id}`, {
        method: 'DELETE',
      })
      resource.reload()
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{product.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {product.status} · {product.sku} ·{' '}
          {money(product.priceMinor, product.currency)}
        </p>
        <p className="mt-2 text-xs text-muted">
          Canonical product ID: {product.id}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          className="text-sm font-bold text-primary"
          href={'/inventory?productId=' + id}
        >
          View inventory balances
        </Link>
        <Button variant="secondary" onClick={resource.reload}>
          Refresh product
        </Button>
      </div>
      <Panel className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">Size / color variants</h3>
          {canWrite && (
            <Button
              disabled={
                busy ||
                product.variants.length >= 100 ||
                (!product.hasVariants && product.stockOnHand !== 0)
              }
              onClick={() => setVariant(null)}
            >
              Add variant
            </Button>
          )}
        </div>
        {!product.hasVariants && product.stockOnHand !== 0 && (
          <p className="mt-3 text-sm text-muted">
            Reduce the base SKU stock through Inventory before converting to
            variants.
          </p>
        )}
        <ErrorMessage text={error} />
        {product.variants.map((v) => (
          <div
            key={v.id}
            className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm"
          >
            <div>
              <p className="font-bold">{v.sku}</p>
              <p>
                {[v.options.size, v.options.color].filter(Boolean).join(' / ')}{' '}
                · {money(v.priceMinor ?? product.priceMinor, product.currency)}{' '}
                · {v.stockOnHand} physical units
              </p>
            </div>
            {canWrite && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setVariant(v)}>
                  Edit variant
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    busy || product.status !== 'DRAFT' || v.stockOnHand !== 0
                  }
                  onClick={() => void remove(v)}
                >
                  Delete variant
                </Button>
              </div>
            )}
          </div>
        ))}
        {variant !== undefined && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <VariantForm
              key={variant?.id || 'new'}
              product={product}
              initial={variant}
              saved={() => {
                setVariant(undefined)
                resource.reload()
              }}
            />
            <Button variant="ghost" onClick={() => setVariant(undefined)}>
              Cancel variant editor
            </Button>
          </div>
        )}
      </Panel>
      {canWrite && (
        <ProductMedia
          key={product.gallery.map((i) => i.id).join(',')}
          product={product}
          saved={resource.reload}
        />
      )}
    </div>
  )
}
function VariantForm({
  initial,
  product,
  saved,
}: {
  initial: Variant | null
  product: Product
  saved: () => void
}) {
  const [sku, setSku] = useState(initial?.sku || ''),
    [size, setSize] = useState(initial?.options.size || ''),
    [color, setColor] = useState(initial?.options.color || ''),
    [price, setPrice] = useState(
      initial?.priceMinor == null
        ? ''
        : moneyInput(initial.priceMinor, product.currency),
    ),
    [stock, setStock] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (!size.trim() && !color.trim())
        throw new Error('Set at least size or color.')
      await api.request(
        `/v1/admin/products/${product.id}/variants` +
          (initial ? '/' + initial.id : ''),
        {
          method: initial ? 'PATCH' : 'POST',
          body: {
            sku,
            options: {
              ...(size.trim() ? { size: size.trim() } : {}),
              ...(color.trim() ? { color: color.trim() } : {}),
            },
            priceMinor: price ? minorFromInput(price, product.currency) : null,
            ...(!initial ? { stockOnHand: stock } : {}),
          },
        },
      )
      saved()
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        <Field label="Variant SKU">
          <input
            required
            className={controlClass}
            maxLength={120}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </Field>
        <Field label="Size">
          <input
            className={controlClass}
            maxLength={100}
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </Field>
        <Field label="Color">
          <input
            className={controlClass}
            maxLength={100}
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </Field>
        <Field label={`Override price (${product.currency}, blank inherits)`}>
          <input
            className={controlClass}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        {!initial && (
          <Field label="Initial variant stock">
            <input
              required
              type="number"
              min={0}
              max={2147483647}
              className={controlClass}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </Field>
        )}
        <div className="sm:col-span-2">
          <ErrorMessage text={error} />
          <Button type="submit">{busy ? 'Saving…' : 'Save variant'}</Button>
        </div>
      </fieldset>
    </form>
  )
}
