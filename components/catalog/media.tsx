/* eslint-disable @next/next/no-img-element -- Verified provider URLs and original disk assets are delivered directly. */
'use client'
import { useState } from 'react'
import { api } from '@/lib/api/client'
import {
  imageUrl,
  type Asset,
  type Page,
  type Product,
} from '@/lib/api/catalog'
import { transferImage, type UploadInstruction } from '@/lib/api/media-upload'
import { Button } from '@/components/ui/button'
import { controlClass } from '@/components/ui/field'
import { Panel, SectionHeading } from '@/components/ui/panel'
import { Badge, statusKind } from '@/components/ui/badge'
import { AdminEmptyState } from '@/components/ui/admin-workspace'
import { PageHeading } from '@/components/layout/page-heading'
import {
  ErrorMessage,
  Pagination,
  ResourceState,
  message,
  useResource,
} from './shared'
export function MediaImage({
  url,
  alt,
  className = '',
  width,
  height,
}: {
  url: string | null | undefined
  alt: string
  className?: string
  width?: number
  height?: number
}) {
  const [failed, setFailed] = useState(false),
    src = imageUrl(url),
    imageWidth =
      Number.isSafeInteger(width) && Number(width) > 0 ? Number(width) : 1,
    imageHeight =
      Number.isSafeInteger(height) && Number(height) > 0 ? Number(height) : 1
  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      width={imageWidth}
      height={imageHeight}
      className={className + ' object-contain'}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      draggable={false}
      onError={() => setFailed(true)}
    />
  ) : (
    <span
      className={
        className +
        ' flex items-center justify-center bg-slate-100 p-3 text-center text-xs text-muted'
      }
    >
      Image preview unavailable
    </span>
  )
}
const mediaModules = [
  'products',
  'categories',
  'brands',
  'banners',
  'branding',
  'notifications',
] as const

function ImageUpload({ complete }: { complete: () => void }) {
  const [module, setModule] =
    useState<(typeof mediaModules)[number]>('products')
  const [pending, setPending] = useState<{
      file: File
      instruction: UploadInstruction
      transferred: boolean
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  async function verify(item: NonNullable<typeof pending>) {
    await api.request<Asset>(
      '/v1/admin/media/' + item.instruction.mediaId + '/complete',
      {
        method: 'POST',
      },
    )
    setPending(null)
    setNotice('Image verified and available in the library.')
    complete()
  }
  async function run(file?: File, verificationOnly = false) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      let item = pending
      if (!item && file) {
        if (
          !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(
            file.type,
          ) ||
          file.size < 1 ||
          file.size > 10485760
        )
          throw new Error(
            'Choose a JPEG, PNG, WebP or AVIF image up to 10 MiB. The configured provider may support a smaller set.',
          )
        const instruction = await api.request<UploadInstruction>(
          '/v1/admin/media/uploads',
          {
            method: 'POST',
            body: { module, mimeType: file.type, bytes: file.size },
          },
        )
        item = { file, instruction, transferred: false }
        setPending(item)
      }
      if (!item) return
      if (!verificationOnly && !item.transferred) {
        await transferImage(item.file, item.instruction)
        item = { ...item, transferred: true }
        setPending(item)
      }
      await verify(item)
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Panel className="p-4 sm:p-5">
      <SectionHeading
        title="Upload verified image"
        subtitle="Transfer through the configured storage provider, then verify the asset on the server."
        action={<Badge kind="info">Verified upload flow</Badge>}
      />
      <label className="mt-3 block text-sm">
        Image module
        <select
          className={controlClass + ' mt-1'}
          value={module}
          disabled={busy || Boolean(pending)}
          onChange={(event) =>
            setModule(event.target.value as (typeof mediaModules)[number])
          }
        >
          {mediaModules.map((value) => (
            <option key={value} value={value}>
              {value === 'branding'
                ? 'Store branding'
                : value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        No public preview is guaranteed before an asset is attached. A pending
        upload remains available for the same upload or verification retry.
      </p>
      <input
        aria-label="Upload image"
        className="mt-4 block min-h-11 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={busy || Boolean(pending)}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void run(file)
          e.target.value = ''
        }}
      />
      <ErrorMessage text={error} />
      {notice && (
        <p role="status" className="mt-3 text-sm text-primary">
          {notice}
        </p>
      )}
      {busy && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-800"
        >
          Uploading / verifying…
        </p>
      )}
      {pending && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">
            Pending asset: {pending.instruction.mediaId}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => void run()}
            >
              {pending.transferred ? 'Retry verification' : 'Retry same upload'}
            </Button>
            {!pending.transferred && (
              <Button
                disabled={busy}
                variant="secondary"
                onClick={() => void run(undefined, true)}
              >
                Verify uploaded file
              </Button>
            )}
            <Button
              disabled={busy}
              variant="ghost"
              onClick={() => {
                setPending(null)
                setError('')
                complete()
              }}
            >
              Leave pending upload
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
export function MediaLibrary({
  choose,
  selected = [],
}: {
  choose?: (asset: Asset) => void
  selected?: string[]
}) {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(''),
    [id, setId] = useState(''),
    [status, setStatus] = useState('ACTIVE'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('')
  const resource = useResource<Page<Asset>>('/v1/admin/media', {
    page,
    limit: 12,
    id: id || undefined,
    status,
  })
  async function remove(asset: Asset) {
    if (
      !window.confirm(
        'Schedule this unreferenced asset for deletion after retention? Existing references prevent deletion.',
      )
    )
      return
    setBusy(true)
    setError('')
    try {
      const result = await api.request<{ scheduled: boolean }>(
        '/v1/admin/media/' + asset.id,
        {
          method: 'DELETE',
        },
      )
      setNotice(
        result.scheduled
          ? 'Deletion scheduled after retention; not immediately deleted.'
          : 'Asset was already deleted.',
      )
      resource.reload()
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      <ImageUpload
        complete={() => {
          setId('')
          setSearch('')
          setStatus('ACTIVE')
          setPage(1)
          resource.reload()
        }}
      />
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <SectionHeading
            title="Asset directory"
            subtitle={
              resource.data
                ? `${resource.data.total.toLocaleString('en-US')} server records · 12 per page`
                : 'Verified and pending media assets'
            }
            action={
              <Button
                size="sm"
                variant="ghost"
                busy={resource.isRefreshing}
                pendingLabel="Refreshing…"
                onClick={resource.reload}
              >
                Refresh library
              </Button>
            }
          />
        </div>
        <form
          className="grid gap-3 border-b border-line bg-slate-50/70 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end sm:p-5"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setId(search.trim())
          }}
        >
          <input
            className={controlClass + ' min-w-0'}
            aria-label="Find media by UUID"
            placeholder="Exact asset UUID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" type="submit">
            Find media
          </Button>
          <select
            aria-label="Media status"
            className={controlClass + ' w-auto'}
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
          >
            {[
              'ACTIVE',
              'PENDING_UPLOAD',
              'PENDING_DELETE',
              'DELETE_FAILED',
              'DELETED',
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </form>
        <ErrorMessage text={error} />
        {notice && (
          <p
            role="status"
            className="mx-4 mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800 sm:mx-5"
          >
            {notice}
          </p>
        )}
        {!resource.data ? (
          <div className="p-4 sm:p-5">
            <ResourceState
              error={resource.error}
              retry={resource.reload}
              variant="grid"
            />
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {resource.data.items.map((asset) => (
                <div
                  key={asset.id}
                  data-testid={'media-asset-' + asset.id}
                  className="admin-offscreen-card admin-offscreen-media-card min-w-0 rounded-2xl border border-line bg-white p-3 shadow-[0_3px_14px_rgba(15,23,42,.025)] transition-shadow hover:shadow-sm"
                >
                  <MediaImage
                    key={asset.url}
                    url={asset.url}
                    alt="Media library image"
                    width={asset.width}
                    height={asset.height}
                    className="h-36 w-full rounded-xl bg-slate-50"
                  />
                  <p className="mt-2 break-all text-xs font-semibold">
                    {asset.id}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge kind={statusKind(asset.status)}>
                      {asset.status}
                    </Badge>
                    <Badge>{asset.mimeType}</Badge>
                  </div>
                  <p className="mt-2 text-xs tabular-nums text-muted">
                    {asset.width}×{asset.height} ·{' '}
                    {asset.bytes.toLocaleString('en-US')} bytes
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    {choose && (
                      <Button
                        disabled={
                          asset.status !== 'ACTIVE' ||
                          selected.includes(asset.id) ||
                          selected.length >= 6
                        }
                        size="sm"
                        onClick={() => choose(asset)}
                      >
                        {selected.includes(asset.id) ? 'Selected' : 'Use image'}
                      </Button>
                    )}
                    <Button
                      disabled={
                        busy ||
                        asset.status === 'DELETED' ||
                        asset.status === 'PENDING_DELETE'
                      }
                      size="sm"
                      variant="danger"
                      onClick={() => void remove(asset)}
                    >
                      Schedule deletion
                    </Button>
                    {asset.status === 'PENDING_UPLOAD' && (
                      <Button
                        size="sm"
                        disabled={busy}
                        variant="secondary"
                        onClick={async () => {
                          setBusy(true)
                          setError('')
                          try {
                            await api.request(
                              '/v1/admin/media/' + asset.id + '/complete',
                              {
                                method: 'POST',
                              },
                            )
                            resource.reload()
                          } catch (error) {
                            setError(message(error))
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Verify upload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!resource.data.items.length && (
              <div className="px-4 pb-4 sm:px-5">
                <AdminEmptyState
                  title="No media match these filters"
                  description="Try another asset status or exact media UUID."
                />
              </div>
            )}
            <Pagination data={resource.data} change={setPage} />
          </>
        )}
      </Panel>
    </div>
  )
}
export function ProductMedia({
  product,
  saved,
}: {
  product: Product
  saved: () => void
}) {
  const [items, setItems] = useState(
      product.gallery.map((image) => ({
        mediaId: image.id,
        altText: image.alt || '',
        url: image.url,
        width: image.width,
        height: image.height,
      })),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [dirty, setDirty] = useState(false)
  function move(index: number, direction: number) {
    setItems((previous) => {
      const next = [...previous]
      ;[next[index], next[index + direction]] = [
        next[index + direction],
        next[index],
      ]
      return next
    })
    setDirty(true)
  }
  async function save() {
    setBusy(true)
    setError('')
    try {
      await api.request('/v1/admin/products/' + product.id + '/media', {
        method: 'PUT',
        body: {
          items: items.map(({ mediaId, altText }, position) => ({
            mediaId,
            altText,
            position,
          })),
        },
      })
      setDirty(false)
      saved()
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Panel className="p-4">
      <h3 className="font-bold">Verified product gallery</h3>
      <p className="mt-2 text-sm text-muted">
        Up to six images. The first image is the cover. Removing references can
        schedule orphan cleanup after retention.
      </p>
      <fieldset disabled={busy} className="mt-4 space-y-4">
        {items.map((image, index) => (
          <div
            key={image.mediaId}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3"
          >
            <MediaImage
              key={image.url}
              url={image.url}
              alt={image.altText}
              width={image.width}
              height={image.height}
              className="h-16 w-20 rounded-lg"
            />
            <input
              aria-label={'Image ' + (index + 1) + ' alt text'}
              maxLength={250}
              className={controlClass + ' min-w-40 flex-1'}
              value={image.altText}
              placeholder="Describe this image"
              onChange={(e) => {
                setItems((previous) =>
                  previous.map((i) =>
                    i.mediaId === image.mediaId
                      ? { ...i, altText: e.target.value }
                      : i,
                  ),
                )
                setDirty(true)
              }}
            />
            <Button
              variant="secondary"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              Move up
            </Button>
            <Button
              variant="secondary"
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              Move down
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setItems((previous) =>
                  previous.filter((i) => i.mediaId !== image.mediaId),
                )
                setDirty(true)
              }}
            >
              Remove image
            </Button>
          </div>
        ))}
        <ErrorMessage text={error} />
        <Button
          busy={busy}
          pendingLabel="Saving gallery…"
          disabled={!dirty || product.status === 'ARCHIVED'}
          onClick={() => void save()}
        >
          Save gallery
        </Button>
        {dirty && (
          <p role="status" className="text-xs text-amber-800">
            Gallery changes are not saved yet.
          </p>
        )}
        <MediaLibrary
          selected={items.map((i) => i.mediaId)}
          choose={(asset) => {
            if (
              items.length < 6 &&
              !items.some((i) => i.mediaId === asset.id)
            ) {
              setItems((previous) => [
                ...previous,
                {
                  mediaId: asset.id,
                  altText: '',
                  url: asset.url || '',
                  width: asset.width,
                  height: asset.height,
                },
              ])
              setDirty(true)
            }
          }}
        />
      </fieldset>
    </Panel>
  )
}
export function MediaPage() {
  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="CATALOG ASSETS"
        title="Media library"
        description="Upload, verify, reuse and manage canonical image assets."
      />
      <MediaLibrary />
    </section>
  )
}
