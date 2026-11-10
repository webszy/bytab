import { ref } from 'vue';
import { defaultShortcuts, type Shortcut, type ShortcutPosition } from '../utils/shortcuts';
import { isRecord, storageKeys, updateLocalValue, useLocalValue } from '../utils/storage';
import { websiteUrl } from '../utils/urls';

function parseShortcuts(value: unknown): Shortcut[] {
  if (!Array.isArray(value)) return defaultShortcuts.map(shortcut => ({ ...shortcut }));
  const ids = new Set<string>();
  return value.flatMap((item): Shortcut[] => {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id || ids.has(item.id)
      || typeof item.title !== 'string' || !item.title.trim()
      || typeof item.url !== 'string' || !websiteUrl(item.url)) return [];
    ids.add(item.id);
    const shortcut: Shortcut = { id: item.id, title: item.title, url: item.url };
    const position = item.position;
    if (isRecord(position) && typeof position.x === 'number' && typeof position.y === 'number'
      && Number.isFinite(position.x) && Number.isFinite(position.y)) {
      shortcut.position = {
        x: Math.min(1, Math.max(0, position.x)),
        y: Math.min(1, Math.max(0, position.y)),
      };
    }
    return [shortcut];
  });
}

export function useShortcuts() {
  const stored = useLocalValue(storageKeys.shortcuts, defaultShortcuts, parseShortcuts);
  const saving = ref(false);
  const error = ref('');

  async function change(update: (current: Shortcut[]) => Shortcut[]) {
    saving.value = true;
    error.value = '';
    try {
      stored.value.value = await updateLocalValue(storageKeys.shortcuts, parseShortcuts, update);
      return true;
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not save shortcuts. Try again.';
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function save(id: string | null, title: string, inputUrl: string) {
    const url = websiteUrl(inputUrl);
    if (!title.trim() || !url) {
      error.value = 'Enter a name and a valid HTTP or HTTPS URL.';
      return false;
    }
    return change(current => {
      if (id === null) {
        return [...current, { id: crypto.randomUUID(), title: title.trim(), url: url.href }];
      }
      if (!current.some(item => item.id === id)) {
        throw new Error('This shortcut was deleted in another tab.');
      }
      return current.map(item => item.id === id ? { ...item, title: title.trim(), url: url.href } : item);
    });
  }

  function remove(id: string) {
    return change(current => current.filter(item => item.id !== id));
  }

  function move(id: string, position?: ShortcutPosition, beforeId?: string | null) {
    return change(current => {
      const item = current.find(shortcut => shortcut.id === id);
      if (!item) return current;
      const moved = { ...item };
      if (position) moved.position = position;
      else delete moved.position;
      if (beforeId === undefined) {
        return current.map(shortcut => shortcut.id === id ? moved : shortcut);
      }
      const reordered = current.filter(shortcut => shortcut.id !== id);
      const index = beforeId === null ? reordered.length : reordered.findIndex(shortcut => shortcut.id === beforeId);
      reordered.splice(index < 0 ? reordered.length : index, 0, moved);
      return reordered;
    });
  }

  function resetLayout() {
    return change(current => {
      const originalOrder = defaultShortcuts.map(shortcut => shortcut.id);
      return current.map(({ position: _position, ...shortcut }) => shortcut)
        .sort((left, right) => {
          const leftIndex = originalOrder.indexOf(left.id);
          const rightIndex = originalOrder.indexOf(right.id);
          return (leftIndex < 0 ? originalOrder.length : leftIndex)
            - (rightIndex < 0 ? originalOrder.length : rightIndex);
        });
    });
  }

  return { items: stored.value, loading: stored.loading, loadError: stored.error, saving, error, save, remove, move, resetLayout };
}
