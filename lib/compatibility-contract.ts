/**
 * eShop compatibility draft v1, based on the storefront's existing
 * lib/api/contracts.ts. This is not a generated client or a live API contract.
 * The storefront ZIP reviewed was kookaburra-storefront-full-20261018-214154.zip.
 * Storefront reference records below are FIXTURE snapshots, not trusted inventory.
 */
import type { Product, Category, Order } from './types'

export type Currency = 'USD'
export type ApiMoney = { amountMinor: number; currency: Currency }
export type ApiVariant = {
  id: string
  sku: string
  options: Record<string, string>
  available: boolean
}
export type ApiProduct = {
  id: string
  slug: string
  categoryIds: string[]
  title: { en: string }
  description: { en: string }
  images: { url: string; alt: { en: string } }[]
  variants: ApiVariant[]
  price: ApiMoney
  compareAt?: ApiMoney
  purchasable: boolean
}
export type ApiCategory = {
  id: string
  slug: string
  parentId: string | null
  name: { en: string }
  imageUrl?: string
  sortOrder: number
  active: boolean
}
/** Mirrored draft DTO surfaces from the Customer Storefront's proposed API. */
export type ApiCartItem = {
  productId: string
  variantId: string | null
  quantity: number
}
export type ApiCart = { id: string; items: ApiCartItem[]; updatedAt: string }
export type ApiAddress = {
  recipient: string
  email: string
  phone: string
  line1: string
  line2?: string
  city: string
  region: string
  postalCode: string
  countryCode: string
}
export type ApiDeliveryOption = {
  id: string
  label: string
  estimate: string
  fee: ApiMoney
}
export type ApiCheckoutQuote = {
  quoteId: string
  currency: Currency
  lines: {
    productId: string
    variantId: string | null
    quantity: number
    unitPrice: ApiMoney
    lineTotal: ApiMoney
  }[]
  subtotal: ApiMoney
  shipping: ApiMoney
  tax: ApiMoney
  total: ApiMoney
  deliveryOptions: ApiDeliveryOption[]
  expiresAt: string
}
export type QuoteRequest = { destination: ApiAddress; items: ApiCartItem[] }
export type ApiOrder = {
  id: string
  number: string
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'
  total: ApiMoney
  placedAt: string
  tracking?: {
    carrier?: string
    trackingNumber?: string
    events: { occurredAt: string; label: string }[]
  }
}
/** Admin backend order lines must separately keep option/SKU snapshots. */
export type DraftOrderLine = {
  productId: string
  variantId: string | null
  /** Missing IDs remain null on legacy previews. Never guess a variant. */
  sku: string | null
  optionSnapshot: Record<string, string>
  quantity: number
  unitPrice: ApiMoney
  lineTotal: ApiMoney
  needsVariantResolution: boolean
}
export const storefrontCategories = [
  { slug: 'electronics', label: 'Electronics' },
  { slug: 'fashion', label: 'Fashion' },
  { slug: 'footwear', label: 'Shoes & Footwear' },
  { slug: 'home', label: 'Home & Living' },
  { slug: 'beauty', label: 'Beauty' },
  { slug: 'lifestyle', label: 'Lifestyle' },
  { slug: 'accessories', label: 'Accessories' },
] as const

/** Explicit *suggested* fixture matches; not database ID migrations. */
export const storefrontReference = [
  {
    id: 'p-headphones',
    slug: 'sonic-wireless-headphones',
    name: 'Sonic Studio Wireless Headphones',
    category: 'electronics',
    usd: 59,
    stock: 24,
    variantCount: 0,
    adminSeedId: 'p-101',
    confidence: 'candidate',
  },
  {
    id: 'p-sneaker',
    slug: 'motion-everyday-sneaker',
    name: 'Motion Everyday Sneakers',
    category: 'footwear',
    usd: 46,
    stock: 32,
    variantCount: 10,
    adminSeedId: 'p-102',
    confidence: 'candidate',
  },
  {
    id: 'p-shirt',
    slug: 'daybreak-cotton-tee',
    name: 'Daybreak Cotton Crew T-Shirt',
    category: 'fashion',
    usd: 18,
    stock: 38,
    variantCount: 8,
    adminSeedId: 'p-103',
    confidence: 'candidate',
  },
  {
    id: 'p-serum',
    slug: 'dew-hydrating-serum',
    name: 'Dew Hydrating Face Serum',
    category: 'beauty',
    usd: 16,
    stock: 30,
    variantCount: 0,
    adminSeedId: 'p-104',
    confidence: 'candidate',
  },
  {
    id: 'p-watch',
    slug: 'orbit-classic-watch',
    name: 'Orbit Classic Wrist Watch',
    category: 'accessories',
    usd: 39,
    stock: 18,
    variantCount: 0,
    adminSeedId: 'p-105',
    confidence: 'candidate',
  },
  {
    id: 'p-bag',
    slug: 'everyday-canvas-tote',
    name: 'Everyday Canvas Tote Bag',
    category: 'fashion',
    usd: 22,
    stock: 40,
    variantCount: 2,
    adminSeedId: 'p-106',
    confidence: 'candidate',
  },
  {
    id: 'p-lamp',
    slug: 'halo-table-lamp',
    name: 'Halo Ambient Table Lamp',
    category: 'home',
    usd: 29,
    stock: 21,
    variantCount: 0,
    adminSeedId: 'p-107',
    confidence: 'unconfirmed',
  },
  {
    id: 'p-speaker',
    slug: 'echo-mini-speaker',
    name: 'Echo Mini Portable Speaker',
    category: 'electronics',
    usd: 35,
    stock: 13,
    variantCount: 0,
    adminSeedId: 'p-108',
    confidence: 'candidate',
  },
  {
    id: 'p-chair',
    slug: 'arc-lounge-chair',
    name: 'Arc Modern Lounge Chair',
    category: 'home',
    usd: 129,
    stock: 7,
    variantCount: 0,
    adminSeedId: null,
    confidence: 'missing',
  },
  {
    id: 'p-loafers',
    slug: 'harbor-classic-loafers',
    name: 'Harbor Classic Everyday Loafers',
    category: 'footwear',
    usd: 54,
    stock: 27,
    variantCount: 8,
    adminSeedId: null,
    confidence: 'missing',
  },
  {
    id: 'p-bottle',
    slug: 'trail-insulated-bottle',
    name: 'Trail Insulated Water Bottle',
    category: 'lifestyle',
    usd: 19,
    stock: 34,
    variantCount: 0,
    adminSeedId: null,
    confidence: 'missing',
  },
] as const

export function toUsdMinor(value: number): number {
  if (!Number.isFinite(value) || value < 0)
    throw new Error('Invalid USD amount')
  return Math.round((value + Number.EPSILON) * 100)
}
export function draftSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
export function draftApiProduct(
  product: Product,
  categories: Category[],
): ApiProduct {
  const selectedCategory = categories.find((c) => c.id === product.categoryId)
  const result: ApiProduct = {
    id: product.id, // Preview ID, NOT a canonical backend identity.
    slug: draftSlug(product.slug || product.name),
    categoryIds: selectedCategory ? [selectedCategory.id] : [],
    title: { en: product.name },
    description: { en: product.description || '' },
    images: (product.images ?? []).map((image) => ({
      url: image.url,
      alt: { en: image.alt },
    })),
    variants: (product.variants ?? []).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      options: {
        ...(variant.size.trim() ? { size: variant.size.trim() } : {}),
        ...(variant.color.trim() ? { color: variant.color.trim() } : {}),
      },
      available: variant.stock > 0,
    })),
    price: { amountMinor: toUsdMinor(product.price), currency: 'USD' },
    purchasable:
      product.status === 'Active' &&
      (product.variants?.length
        ? product.variants.some((v) => v.stock > 0)
        : product.stock > 0),
  }
  if (product.compareAt !== undefined)
    result.compareAt = {
      amountMinor: toUsdMinor(product.compareAt),
      currency: 'USD',
    }
  return result
}
export function draftApiCategory(
  category: Category,
  index: number,
): ApiCategory {
  return {
    id: category.id,
    slug: category.slug,
    parentId: category.parentId || null,
    name: { en: category.name },
    sortOrder: index,
    active: true,
  }
}
export function draftOrderLines(order: Order): DraftOrderLine[] {
  return order.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId ?? null,
    sku: item.sku ?? null,
    optionSnapshot: { ...(item.optionSnapshot ?? {}) },
    quantity: item.qty,
    unitPrice: { amountMinor: toUsdMinor(item.price), currency: 'USD' },
    lineTotal: {
      amountMinor: toUsdMinor(item.price * item.qty),
      currency: 'USD',
    },
    needsVariantResolution: !item.variantId,
  }))
}
export function categoryGaps(categories: Category[]): string[] {
  return storefrontCategories
    .filter((entry) => !categories.some((c) => c.slug === entry.slug))
    .map((entry) => entry.slug)
}
export function productGaps(
  product: Product,
  categories: Category[],
): string[] {
  const gaps: string[] = []
  if (!product.description?.trim()) gaps.push('Description missing')
  if (!product.images?.length) gaps.push('Media missing')
  if (!categories.some((c) => c.id === product.categoryId))
    gaps.push('Category missing')
  if ((product.variants ?? []).some((v) => !v.size.trim() && !v.color.trim()))
    gaps.push('Variant options missing')
  return gaps
}
