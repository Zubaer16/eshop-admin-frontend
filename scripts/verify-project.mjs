import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'
function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(path, entry.name))
      : [join(path, entry.name)],
  )
}
const files = ['app', 'components', 'lib']
  .flatMap(walk)
  .filter((file) => /\.[jt]sx?$/.test(file))
for (const file of files)
  assert.doesNotMatch(
    readFileSync(file, 'utf8'),
    /isPreviewMode|useAdminStore|NEXT_PUBLIC_ESHOP_MODE|@\/lib\/(fixtures|store|integration-mode)/,
    file,
  )
for (const file of [
  'lib/fixtures.ts',
  'lib/store.ts',
  'lib/integration-mode.ts',
])
  assert.equal(existsSync(file), false, file)
for (const file of [
  'components/layout/page-heading.tsx',
  'components/ui/record-details.tsx',
  'components/management/dashboard.tsx',
  'e2e/admin.spec.mjs',
])
  assert.ok(existsSync(file), file)
assert.match(
  readFileSync('components/auth/auth-provider.tsx', 'utf8'),
  /api.restoreSession/,
)
assert.match(
  readFileSync('components/catalog/products.tsx', 'utf8'),
  /priceMinor/,
)
console.log(`Verified single connected UI across ${files.length} source files.`)
