/** Pure checks for the draft compatibility DTO, no backend needed. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'
import vm from 'node:vm'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const file = resolve('lib/compatibility-contract.ts')
const output = ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: file,
  reportDiagnostics: true,
})
const errors = (output.diagnostics ?? []).filter(
  (d) => d.category === ts.DiagnosticCategory.Error,
)
assert.equal(errors.length, 0, 'Draft contract syntax must compile')
function loadPureTs(relativePath) {
  const code = ts.transpileModule(readFileSync(resolve(relativePath), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const compiledModule = { exports: {} }
  vm.runInNewContext(
    code,
    { exports: compiledModule.exports, module: compiledModule, require },
    { filename: relativePath },
  )
  return compiledModule.exports
}
const c = loadPureTs('lib/compatibility-contract.ts')
const catalog = loadPureTs('lib/catalog.ts')
assert.equal(c.storefrontCategories.length, 7)
assert.equal(c.storefrontReference.length, 11)
assert.equal(new Set(c.storefrontReference.map((p) => p.id)).size, 11)
assert.equal(
  c.storefrontReference.filter((p) => p.adminSeedId === null).length,
  3,
)
assert.equal(c.toUsdMinor(19.99), 1999)
assert.equal(
  catalog.productValidationError(
    {
      ...productFixture(),
      name: 'Color-only Bag',
      sku: 'BAG-V1',
      categoryId: 'cat-fashion',
      variants: [
        {
          id: 'v-natural',
          sku: 'BAG-NAT',
          size: '',
          color: 'Natural',
          stock: 1,
        },
      ],
    },
    [],
  ),
  null,
)
assert.match(
  catalog.productValidationError({ ...productFixture(), compareAt: 10 }, []),
  /Compare-at price/,
)
assert.match(
  catalog.productValidationError(
    { ...productFixture(), slug: 'existing-one' },
    [{ ...productFixture(), id: 'old', name: 'Existing one' }],
  ),
  /slug is already used/,
)
function productFixture() {
  return {
    id: 'tmp',
    name: 'Test Item',
    sku: 'T-1',
    categoryId: 'cat-fashion',
    price: 20,
    stock: 2,
    status: 'Draft',
    color: '#eee',
    createdAt: '',
  }
}
assert.equal(c.toUsdMinor(0), 0)
assert.throws(() => c.toUsdMinor(-5))
assert.throws(() => c.toUsdMinor(NaN))
const categories = [
  {
    id: 'cat-fashion',
    slug: 'fashion',
    name: 'Fashion',
    description: '',
    color: '',
  },
]
const product = {
  id: 'draft-1',
  name: 'Canvas Tote',
  slug: 'canvas-tote',
  categoryId: 'cat-fashion',
  price: 22.25,
  compareAt: 32.5,
  status: 'Active',
  stock: 3,
  sku: 'TOTE',
  images: [{ id: 'img-1', url: '/products/tote.svg', alt: 'Canvas tote' }],
  description: 'A color-only example',
  variants: [
    {
      id: 'v-natural',
      sku: 'TOTE-NATURAL',
      size: '',
      color: 'Natural',
      stock: 3,
    },
  ],
}
const projected = c.draftApiProduct(product, categories)
assert.equal(projected.price.amountMinor, 2225)
assert.equal(projected.compareAt.amountMinor, 3250)
assert.equal(projected.variants[0].options.color, 'Natural')
assert.equal(Object.keys(projected.variants[0].options).length, 1)
assert.equal(projected.categoryIds[0], 'cat-fashion')
assert.equal(projected.purchasable, true)
const stockZero = c.draftApiProduct(
  { ...product, variants: [{ ...product.variants[0], stock: 0 }] },
  categories,
)
assert.equal(stockZero.purchasable, false)
const gaps = c.categoryGaps(categories)
assert.ok(gaps.includes('lifestyle'))
assert.ok(!gaps.includes('fashion'))
const lines = c.draftOrderLines({
  items: [
    { productId: 'p-1', name: 'Test', qty: 2, price: 19.95 },
    {
      productId: 'p-2',
      variantId: 'v-2',
      sku: 'SKU-2',
      optionSnapshot: { size: 'M' },
      name: 'Sized',
      qty: 1,
      price: 17,
    },
  ],
})
assert.equal(lines[0].variantId, null)
assert.equal(lines[0].needsVariantResolution, true)
assert.equal(lines[0].lineTotal.amountMinor, 3990)
assert.equal(lines[1].needsVariantResolution, false)
assert.equal(lines[1].optionSnapshot.size, 'M')
console.log(
  'eShop draft compatibility contract OK (categories, reference IDs, USD cents, color-only variants, validation, stock, legacy order lines). No live API tested.',
)
