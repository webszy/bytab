import type { Shortcut, ShortcutPosition } from './shortcuts';
import { websiteUrl } from './urls.ts';

export interface ShortcutFolder {
  id: string;
  title: string;
  kind: 'folder';
  position?: ShortcutPosition;
}
export type ShortcutEntry = Shortcut | ShortcutFolder;
export interface ShortcutBarLayout { pinned: boolean; position?: ShortcutPosition }
export const isShortcutFolder = (item: ShortcutEntry): item is ShortcutFolder => 'kind' in item && item.kind === 'folder';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function parsePosition(value: unknown): ShortcutPosition | undefined {
  if (!record(value) || typeof value.x !== 'number' || typeof value.y !== 'number' || !Number.isFinite(value.x) || !Number.isFinite(value.y)) return;
  return { x: Math.max(0, Math.min(1, value.x)), y: Math.max(0, Math.min(1, value.y)) };
}
export function parseShortcutBar(value: unknown): ShortcutBarLayout {
  return record(value) ? { pinned: value.pinned === true, position: parsePosition(value.position) } : { pinned: false };
}

export function parseShortcutEntries(value: unknown, defaults: Shortcut[]): ShortcutEntry[] {
  if (!Array.isArray(value)) return defaults.map(item => ({ ...item }));
  const ids = new Set<string>();
  const entries = value.flatMap((item): ShortcutEntry[] => {
    if (!record(item) || typeof item.id !== 'string' || !item.id || ids.has(item.id) || typeof item.title !== 'string' || !item.title.trim()) return [];
    if (item.kind !== 'folder' && (typeof item.url !== 'string' || !websiteUrl(item.url))) return [];
    ids.add(item.id);
    const common = { id: item.id, title: item.title.trim(), position: parsePosition(item.position) };
    if (item.kind === 'folder') return [{ ...common, kind: 'folder' }];
    return [{ ...common, url: item.url as string, ...(typeof item.folderId === 'string' ? { folderId: item.folderId } : {}) }];
  });
  const folders = new Set(entries.filter(isShortcutFolder).map(item => item.id));
  return entries.map(item => {
    if (isShortcutFolder(item)) return item;
    const { folderId, position, ...link } = item;
    // Old entries are preserved; orphaned children return to the main bar.
    return folderId && folders.has(folderId) ? { ...link, folderId } : { ...link, position };
  });
}

export function moveIntoFolder(entries: ShortcutEntry[], id: string, folderId: string | null) {
  const item = entries.find(entry => entry.id === id);
  if (!item || isShortcutFolder(item)) throw new Error('Only shortcuts can be placed inside a folder.');
  if (folderId && !entries.some(entry => entry.id === folderId && isShortcutFolder(entry))) throw new Error('This folder no longer exists.');
  return entries.map(entry => {
    if (entry.id !== id || isShortcutFolder(entry)) return entry;
    const { folderId: _folder, position: _position, ...link } = entry;
    return folderId ? { ...link, folderId } : link;
  });
}

export function removeShortcutEntry(entries: ShortcutEntry[], id: string) {
  return entries.filter(item => item.id !== id).map(item => {
    if (!isShortcutFolder(item) && item.folderId === id) {
      const { folderId: _folder, ...link } = item;
      return link;
    }
    return item;
  });
}
