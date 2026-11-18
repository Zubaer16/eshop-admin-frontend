import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  minorFromInput,
  moneyInput,
  shopQuery,
  readProduct,
  readPage,
  categoryLabel,
  imageUrl,
  responsiveImageSrcSet,
  uuidSegment,
} from '../lib/api/catalog.ts'
test('currency amounts use exact decimal parsing, bounds and actual currency precision', () => {
  assert.equal(minorFromInput('19.99'), 1999)
  assert.equal(minorFromInput('0.01'), 1)
  assert.equal(minorFromInput('21474836.47'), 2147483647)
  assert.equal(minorFromInput('1.005', 'KWD'), 1005)
  assert.equal(minorFromInput('17', 'JPY'), 17)
  assert.equal(moneyInput(1999), '19.99')
  for (const value of [
    '-1',
    '1.001',
    '1e3',
    'NaN',
    '21474836.48',
    '',
    '9'.repeat(100),
  ])
    assert.throws(() => minorFromInput(value))
  assert.throws(() => minorFromInput('1.1', 'JPY'))
})
test('shop maps only supported server filters with explicit USD price authority', () => {
  assert.deepEqual(
    shopQuery({
      q: ' a&status=DRAFT ',
      min: '1.25',
      max: '9.99',
      stock: 'true',
      sort: 'price-asc',
      category: 'shoes',
      tag: 'new',
      page: '2',
    }),
    {
      page: 2,
      limit: 12,
      search: 'a&status=DRAFT',
      category: 'shoes',
      currency: 'USD',
      sort: 'price-asc',
      inStock: 'true',
      minPriceMinor: 125,
      maxPriceMinor: 999,
      tag: 'new',
    },
  )
  for (const query of [
    { sort: 'featured' },
    { page: '-1' },
    { min: '10', max: '9' },
    { stock: 'yes' },
    { category: '../private' },
  ])
    assert.throws(() => shopQuery(query))
})
test('canonical identities and page schema reject demo identities and malformed API values', () => {
  assert.throws(() => uuidSegment('demo-product-1'))
  assert.throws(() => readProduct({ id: 'demo-product-1' }))
  assert.throws(() =>
    readPage(
      { items: [], total: 1, page: 0, limit: 20, pages: 1 },
      readProduct,
    ),
  )
  assert.deepEqual(
    readPage({ items: [], total: 0, page: 1, limit: 20, pages: 0 }, readProduct)
      .items,
    [],
  )
})
test('category cycles terminate safely and image URLs cannot inject unsafe navigation', () => {
  assert.equal(
    categoryLabel({ id: 'a', name: 'A', parentId: 'b' }, [
      { id: 'b', name: 'B', parentId: 'a' },
    ]),
    'B / A',
  )
  for (const value of [
    'javascript:alert(1)',
    'file:///secret',
    'https://user:secret@example.test/a',
    'http://remote.example.test/a',
  ])
    assert.equal(imageUrl(value), null)
  assert.equal(
    imageUrl('http://127.0.0.1:4101/v1/media/files/a'),
    'http://127.0.0.1:4101/v1/media/files/a',
  )
})

test('responsive image candidates accept only safe Backend-published URLs and unique widths', () => {
  const srcSet =
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320/v1720012345/shirt.png 320w, https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/v1720012345/shirt.png 640w'
  assert.equal(responsiveImageSrcSet(srcSet), srcSet)
  assert.equal(
    responsiveImageSrcSet(
      'https://cdn.example.test/image.webp 320w, javascript:alert(1) 640w',
    ),
    undefined,
  )
  assert.equal(
    responsiveImageSrcSet(
      'https://cdn.example.test/image-1.webp 320w, https://cdn.example.test/image-2.webp 320w',
    ),
    undefined,
  )
  assert.equal(
    responsiveImageSrcSet(
      Array.from(
        { length: 7 },
        (_, index) =>
          `https://cdn.example.test/image-${index}.webp ${320 + index * 160}w`,
      ).join(', '),
    ),
    undefined,
  )
  assert.equal(
    responsiveImageSrcSet('https://cdn.example.test/image.webp 0w'),
    undefined,
  )
})
