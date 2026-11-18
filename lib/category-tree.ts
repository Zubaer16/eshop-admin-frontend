import type { Category } from '@/lib/api/catalog'

export type CategoryTreeNode = {
  category: Category
  children: CategoryTreeNode[]
}

export type FilteredCategoryTreeNode = {
  category: Category
  children: FilteredCategoryTreeNode[]
  matched: boolean
}

function compareCategories(a: Category, b: Category) {
  return (
    a.sortOrder - b.sortOrder ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id)
  )
}

/**
 * Builds a deterministic category tree from the canonical flat API response.
 * Orphaned and cyclic records are retained as visible roots rather than hidden.
 */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const ordered = [...categories].sort(compareCategories)
  const byId = new Map(ordered.map((category) => [category.id, category]))
  const children = new Map<string, Category[]>()
  const roots: Category[] = []

  for (const category of ordered) {
    const parentId = category.parentId
    if (!parentId || parentId === category.id || !byId.has(parentId)) {
      roots.push(category)
      continue
    }
    const siblings = children.get(parentId) || []
    siblings.push(category)
    children.set(parentId, siblings)
  }

  const visited = new Set<string>()
  function build(category: Category, path: Set<string>): CategoryTreeNode {
    visited.add(category.id)
    const nextPath = new Set(path)
    nextPath.add(category.id)
    const nested = (children.get(category.id) || [])
      .filter((child) => !nextPath.has(child.id) && !visited.has(child.id))
      .map((child) => build(child, nextPath))
    return { category, children: nested }
  }

  const tree = roots.map((root) => build(root, new Set()))
  // A parent cycle has no natural root. Keep the remaining component visible.
  for (const category of ordered) {
    if (!visited.has(category.id)) tree.push(build(category, new Set()))
  }
  return tree
}

/** Keeps matching nodes and their ancestors so filtered results retain context. */
export function filterCategoryTree(
  nodes: CategoryTreeNode[],
  predicate: (category: Category) => boolean,
): FilteredCategoryTreeNode[] {
  const result: FilteredCategoryTreeNode[] = []
  for (const node of nodes) {
    const matched = predicate(node.category)
    const children = filterCategoryTree(node.children, predicate)
    if (matched || children.length) {
      result.push({ category: node.category, children, matched })
    }
  }
  return result
}

export function categoryTreeIdsWithChildren(
  nodes: CategoryTreeNode[],
): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.children.length) ids.push(node.category.id)
    ids.push(...categoryTreeIdsWithChildren(node.children))
  }
  return ids
}
