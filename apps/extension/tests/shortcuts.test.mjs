import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseShortcutEntries, parseShortcutBar, moveIntoFolder, removeShortcutEntry } from '../utils/shortcutCollections.ts';
const link = { id: 'a', title: 'Alpha', url: 'https://example.test/' };
const folder = { id: 'f', title: 'Work', kind: 'folder' };

test('legacy shortcuts and empty libraries survive migration', () => {
  assert.deepEqual(parseShortcutEntries(undefined, [link]), [link]);
  assert.deepEqual(parseShortcutEntries([], [link]), []);
  const parsed = parseShortcutEntries([{ ...link, position: { x: .3, y: .4 } }], []);
  assert.deepEqual(parsed[0].position, { x: .3, y: .4 });
  assert.equal(parsed[0].url, link.url);
});
test('folders stay at root, only safe links can be children, orphan links return to root', () => {
  const entries = parseShortcutEntries([{ ...folder, folderId: 'another' }, { ...link, folderId: 'f', position: { x: .5, y: .5 } },
    { ...link, id: 'orphan', folderId: 'missing' }, { ...link, id: 'unsafe', url: 'javascript:alert(1)' }], []);
  assert.equal(entries.length, 3);
  assert.equal(entries[0].folderId, undefined);
  assert.equal(entries[1].folderId, 'f');
  assert.equal(entries[1].position, undefined);
  assert.equal(entries[2].folderId, undefined);
});
test('move into and out of folders clears detached coordinates and prevents nesting', () => {
  const initial = [folder, { ...link, position: { x: .2, y: .4 } }];
  const moved = moveIntoFolder(initial, 'a', 'f');
  assert.equal(moved[1].folderId, 'f');
  assert.equal(moved[1].position, undefined);
  assert.equal(moveIntoFolder(moved, 'a', null)[1].folderId, undefined);
  assert.throws(() => moveIntoFolder(initial, 'f', 'f'), /Only shortcuts/);
  assert.throws(() => moveIntoFolder(initial, 'a', 'missing'), /no longer exists/);
  assert.equal(initial[1].folderId, undefined);
});
test('deleting a folder keeps all contained links at root', () => {
  const entries = [folder, { ...link, folderId: 'f' }, { ...link, id: 'b' }];
  const removed = removeShortcutEntry(entries, 'f');
  assert.deepEqual(removed.map(x => x.id), ['a', 'b']);
  assert.equal(removed[0].folderId, undefined);
  assert.equal(removeShortcutEntry(entries, 'a').length, 2);
});
test('bar layout validates pinned state and clamps persisted positions', () => {
  assert.deepEqual(parseShortcutBar(null), { pinned: false });
  assert.deepEqual(parseShortcutBar({ pinned: true, position: { x: -3, y: 9 } }), { pinned: true, position: { x: 0, y: 1 } });
  assert.deepEqual(parseShortcutBar({ pinned: 'true', position: { x: NaN, y: .5 } }), { pinned: false, position: undefined });
});
