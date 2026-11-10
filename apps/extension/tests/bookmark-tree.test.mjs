import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createBookmarkCatalog, folderTrail, isBookmark, searchBookmarks, survivingFolder,
} from '../utils/bookmarkTree.ts';

const bookmark = (id, title, url = `https://example.test/${id}`) => ({ id, title, url });
const folder = (id, title, children = []) => ({ id, title, children });
const tree = (...children) => [{ id: 'arbitrary-root', title: '', children }];

test('preserves all native roots, standalone bookmarks, duplicate folder names and Chrome order', () => {
  const bar = folder('bar', '收藏夹栏', [
    bookmark('loose', 'Loose'),
    folder('work-a', 'Work', [bookmark('first', 'First')]),
    folder('work-b', 'Work', [bookmark('second', 'Second')]),
  ]);
  const other = folder('other', '其他书签', [bookmark('third', 'Third')]);
  const mobile = folder('mobile', '移动设备', [bookmark('fourth', 'Fourth')]);
  const catalog = createBookmarkCatalog(tree(bar, bookmark('root-link', 'Root link'), other, mobile));
  assert.deepEqual(catalog.roots.map(node => node.id), ['bar', 'root-link', 'other', 'mobile']);
  assert.deepEqual(catalog.searchIndex.map(entry => entry.node.id), ['loose', 'first', 'second', 'root-link', 'third', 'fourth']);
  assert.deepEqual(catalog.folders.map(node => node.id), ['work-a', 'work-b', 'other', 'mobile']);
  assert.equal(catalog.nodes.has('arbitrary-root'), false);
  assert.equal(catalog.searchIndex.find(entry => entry.node.id === 'first').folderPath, '收藏夹栏 / Work');
});

test('works without mobile bookmarks or custom folders', () => {
  const catalog = createBookmarkCatalog(tree(bookmark('only', 'Only bookmark')));
  assert.equal(catalog.folders.length, 0);
  assert.equal(catalog.searchIndex.length, 1);
  assert.equal(catalog.searchIndex[0].folderPath, 'All Bookmarks');
  assert.deepEqual(createBookmarkCatalog([]).roots, []);
  assert.equal(createBookmarkCatalog(tree(folder('empty', 'Empty'))).searchIndex.length, 0);
});

test('an empty or unsafe URL remains a bookmark, never a navigable folder', () => {
  for (const url of ['', 'javascript:alert(1)', 'data:text/html,hello', 'not a URL']) {
    const node = bookmark(url || 'empty-url', 'Invalid', url);
    assert.equal(isBookmark(node), true);
    const catalog = createBookmarkCatalog(tree(node));
    assert.equal(catalog.searchIndex.length, 1);
    assert.equal(catalog.folders.length, 0);
    assert.deepEqual(folderTrail(catalog, node.id), []);
  }
});

test('searches titles, URLs and domains globally, ignoring case and surrounding spaces', () => {
  const catalog = createBookmarkCatalog(tree(
    folder('a', 'A', [bookmark('vue', 'Vue Docs', 'https://VueJS.org/guide')]),
    folder('b', 'B', [bookmark('nuxt', 'Nuxt Docs', 'https://nuxt.com/DOCS')]),
  ));
  assert.deepEqual(searchBookmarks(catalog.searchIndex, '  DOCS ').map(entry => entry.node.id), ['vue', 'nuxt']);
  assert.deepEqual(searchBookmarks(catalog.searchIndex, 'VUEJS.ORG').map(entry => entry.node.id), ['vue']);
  assert.deepEqual(searchBookmarks(catalog.searchIndex, '/docs').map(entry => entry.node.id), ['nuxt']);
  assert.deepEqual(searchBookmarks(catalog.searchIndex, 'missing'), []);
  assert.deepEqual(searchBookmarks(catalog.searchIndex, '  '), []);
});

test('builds breadcrumbs at depth and recovers the nearest surviving parent on deletion', () => {
  const original = createBookmarkCatalog(tree(folder('a', 'A', [folder('b', 'B', [folder('c', 'C')])])));
  const previousTrail = folderTrail(original, 'c');
  assert.deepEqual(previousTrail.map(node => node.id), ['a', 'b', 'c']);
  const deleted = createBookmarkCatalog(tree(folder('a', 'A', [folder('b', 'B')])));
  assert.equal(survivingFolder(deleted, previousTrail), 'b');
  assert.equal(survivingFolder(createBookmarkCatalog(tree(folder('a', 'A'))), previousTrail), 'a');
  assert.equal(survivingFolder(createBookmarkCatalog([]), previousTrail), null);
  const moved = createBookmarkCatalog(tree(folder('d', 'D', [folder('c', 'C')])));
  assert.equal(survivingFolder(moved, previousTrail), 'c');
  assert.deepEqual(folderTrail(moved, 'c').map(node => node.id), ['d', 'c']);
});

test('indexes 500 bookmarks and 20 folders once; repeated queries keep a stable native order', () => {
  const folders = Array.from({ length: 20 }, (_, index) => folder(`folder-${index}`, `Folder ${index}`,
    Array.from({ length: 25 }, (_, child) => bookmark(`link-${index * 25 + child}`, `Bookmark ${index * 25 + child}`))));
  const catalog = createBookmarkCatalog(tree(folder('bar', 'Bookmarks bar', folders)));
  assert.equal(catalog.searchIndex.length, 500);
  assert.equal(catalog.folders.length, 20);
  const originalIds = catalog.searchIndex.map(entry => entry.node.id);
  for (let index = 0; index < 100; index++) {
    assert.deepEqual(searchBookmarks(catalog.searchIndex, 'BOOKMARK').map(entry => entry.node.id), originalIds);
  }
});

test('traverses deeply nested folders without recursive calls', () => {
  let nested = folder('leaf', 'Leaf', [bookmark('target', 'Target')]);
  for (let depth = 0; depth < 500; depth++) nested = folder(`depth-${depth}`, `Depth ${depth}`, [nested]);
  const catalog = createBookmarkCatalog(tree(nested));
  assert.equal(catalog.searchIndex.length, 1);
  assert.equal(folderTrail(catalog, 'leaf').length, 501);
});
