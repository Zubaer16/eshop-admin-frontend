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
import { Panel } from '@/components/ui/panel'
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
}: {
  url: string | null | undefined
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false),
    src = imageUrl(url)
  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      className={className + ' object-contain'}
      loading="lazy"
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
    <div className="rounded-xl border border-line p-4">
      <h3 className="font-bold">Upload verified image</h3>
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
      <p className="mt-2 text-xs text-muted">
        Upload through the configured storage provider, then verify on the
        server. No public preview is guaranteed before an asset is attached.
      </p>
      <input
        aria-label="Upload image"
        className="mt-4 block w-full text-sm"
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
        <p role="status" className="mt-3 text-sm">
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
    </div>
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
    <div className="space-y-4">
      <ImageUpload
        complete={() => {
          setId('')
          setSearch('')
          setStatus('ACTIVE')
          setPage(1)
          resource.reload()
        }}
      />
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setId(search.trim())
        }}
      >
        <input
          className={controlClass + ' max-w-xs'}
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
        <Button type="button" variant="ghost" onClick={resource.reload}>
          Refresh library
        </Button>
      </form>
      <ErrorMessage text={error} />
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}
        </p>
      )}
      {!resource.data ? (
        <ResourceState error={resource.error} retry={resource.reload} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {resource.data.items.map((asset) => (
              <div
                key={asset.id}
                data-testid={'media-asset-' + asset.id}
                className="rounded-xl border border-line p-3"
              >
                <MediaImage
                  key={asset.url}
                  url={asset.url}
                  alt="Media library image"
                  className="h-28 w-full rounded-lg"
                />
                <p className="mt-2 break-all text-xs font-semibold">
                  {asset.id}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {asset.status} · {asset.mimeType} · {asset.width}×
                  {asset.height} · {asset.bytes} bytes
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
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
            <p className="py-5 text-sm text-muted">
              No media match these filters.
            </p>
          )}
          <Pagination data={resource.data} change={setPage} />
        </>
      )}
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
          disabled={!dirty || product.status === 'ARCHIVED'}
          onClick={() => void save()}
        >
          {busy ? 'Saving…' : 'Save gallery'}
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
                { mediaId: asset.id, altText: '', url: asset.url || '' },
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
    <>
      <PageHeading
        eyebrow="CATALOG MEDIA"
        title="Media library"
        description="Upload, verify, reuse and manage canonical image assets."
      />
      <Panel className="p-5">
        <MediaLibrary />
      </Panel>
    </>
  )
}
