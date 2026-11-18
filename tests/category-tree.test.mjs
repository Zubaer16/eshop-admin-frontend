import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCategoryTree,
  filterCategoryTree,
  categoryTreeIdsWithChildren,
} from '../lib/category-tree.ts'

const category = (id, name, parentId = null, sortOrder = 0, active = true) => ({
  id,
  name,
  slug: name.toLowerCase().replaceAll(' ', '-'),
  description: '',
  parentId,
  color: '#EAF0FF',
  sortOrder,
  active,
})

test('category tree sorts roots and children by sort order then name', () => {
  const tree = buildCategoryTree([
    category('root', 'Root', null, 0),
    category('child-b', 'Beta', 'root', 2),
    category('root-b', 'Zeta', null, 2),
    category('child-a', 'Alpha', 'root', 1),
    category('root-a', 'Alpha root', null, 1),
  ])
  assert.deepEqual(
    tree.map((node) => node.category.id),
    ['root', 'root-a', 'root-b'],
  )
  assert.deepEqual(
    tree[0].children.map((node) => node.category.id),
    ['child-a', 'child-b'],
  )
})

test('orphaned and cyclic categories remain visible without infinite recursion', () => {
  const tree = buildCategoryTree([
    category('orphan', 'Orphan', 'missing-parent'),
    category('cycle-a', 'Cycle A', 'cycle-b'),
    category('cycle-b', 'Cycle B', 'cycle-a'),
  ])
  const ids = []
  const visit = (nodes) =>
    nodes.forEach((node) => {
      ids.push(node.category.id)
      visit(node.children)
    })
  visit(tree)
  assert.equal(ids.length, 3)
  assert.deepEqual(new Set(ids), new Set(['orphan', 'cycle-a', 'cycle-b']))
})

test('filter retains ancestors as context for matching descendants', () => {
  const tree = buildCategoryTree([
    category('root', 'Fashion'),
    category('mens', "Men's Fashion", 'root'),
    category('womens', "Women's Fashion", 'root'),
  ])
  const filtered = filterCategoryTree(tree, (item) => item.name.includes('Men'))
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].category.id, 'root')
  assert.equal(filtered[0].matched, false)
  assert.deepEqual(
    filtered[0].children.map((node) => node.category.id),
    ['mens'],
  )
  assert.equal(filtered[0].children[0].matched, true)
})

test('visibility and level predicates can be applied without losing tree context', () => {
  const tree = buildCategoryTree([
    category('root', 'Fashion'),
    category('visible-child', 'Mens', 'root', 1, true),
    category('hidden-child', 'Womens', 'root', 2, false),
  ])
  const hidden = filterCategoryTree(tree, (item) => !item.active)
  assert.equal(hidden[0].category.id, 'root')
  assert.equal(hidden[0].matched, false)
  assert.deepEqual(
    hidden[0].children.map((node) => node.category.id),
    ['hidden-child'],
  )
  const roots = filterCategoryTree(tree, (item) => item.parentId === null)
  assert.equal(roots[0].children.length, 0)
})

test('expand-all identifiers include only categories with children', () => {
  const tree = buildCategoryTree([
    category('root', 'Fashion'),
    category('child', 'Mens', 'root'),
    category('leaf', 'Accessories', 'child'),
  ])
  assert.deepEqual(categoryTreeIdsWithChildren(tree), ['root', 'child'])
})
