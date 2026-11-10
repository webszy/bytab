import type { Browser } from 'wxt/browser';

export type BookmarkNode = Browser.bookmarks.BookmarkTreeNode;

export interface BookmarkSearchEntry {
  node: BookmarkNode;
  folderPath: string;
  text: string;
}

export interface BookmarkCatalog {
  roots: BookmarkNode[];
  nodes: Map<string, BookmarkNode>;
  parents: Map<string, string | null>;
  paths: Map<string, string>;
  folders: BookmarkNode[];
  searchIndex: BookmarkSearchEntry[];
}

// An empty URL is an invalid bookmark, not an empty folder.
export function isBookmark(node: BookmarkNode) {
  return typeof node.url === 'string';
}

export function folderLabel(node: BookmarkNode) {
  return node.title.trim() || 'Untitled folder';
}

export function createBookmarkCatalog(tree: BookmarkNode[]): BookmarkCatalog {
  // getTree's parentless folder is structural; no localized names or fixed IDs.
  const roots = tree.flatMap(node =>
    !isBookmark(node) && node.parentId === undefined ? node.children ?? [] : [node]);
  const nodes = new Map<string, BookmarkNode>();
  const parents = new Map<string, string | null>();
  const paths = new Map<string, string>();
  const searchIndex: BookmarkSearchEntry[] = [];
  const pending = roots.map(node => ({ node, parent: null as string | null, path: '' })).reverse();

  // Iterative preorder preserves Chrome ordering, including across native roots.
  while (pending.length) {
    const { node, parent, path } = pending.pop()!;
    nodes.set(node.id, node);
    parents.set(node.id, parent);
    paths.set(node.id, path);
    if (isBookmark(node)) {
      searchIndex.push({
        node,
        folderPath: path || 'All Bookmarks',
        text: `${node.title} ${node.url}`.toLowerCase(),
      });
      continue;
    }
    const childPath = path ? `${path} / ${folderLabel(node)}` : folderLabel(node);
    const children = node.children ?? [];
    for (let index = children.length - 1; index >= 0; index--) {
      pending.push({ node: children[index]!, parent: node.id, path: childPath });
    }
  }

  // Prefer the first folder level inside Chrome's native containers. Containers
  // with no subfolders remain useful categories; every root is browsable in All.
  const folders = roots.flatMap(node => {
    if (isBookmark(node)) return [];
    const children = (node.children ?? []).filter(child => !isBookmark(child));
    return children.length ? children : [node];
  });
  return { roots, nodes, parents, paths, folders, searchIndex };
}

export function searchBookmarks(index: BookmarkSearchEntry[], query: string) {
  const text = query.trim().toLowerCase();
  return text ? index.filter(entry => entry.text.includes(text)) : [];
}

export function folderTrail(catalog: BookmarkCatalog, id: string | null) {
  const trail: BookmarkNode[] = [];
  const visited = new Set<string>();
  while (id !== null && !visited.has(id)) {
    visited.add(id);
    const node = catalog.nodes.get(id);
    if (!node || isBookmark(node)) break;
    trail.push(node);
    id = catalog.parents.get(id) ?? null;
  }
  return trail.reverse();
}

export function survivingFolder(catalog: BookmarkCatalog, previousTrail: BookmarkNode[]) {
  for (let index = previousTrail.length - 1; index >= 0; index--) {
    const id = previousTrail[index]!.id;
    const node = catalog.nodes.get(id);
    if (node && !isBookmark(node)) return id;
  }
  return null;
}
