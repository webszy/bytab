import { ref } from 'vue';
import { defaultShortcuts, type ShortcutPosition } from '../utils/shortcuts';
import { storageKeys, updateLocalValue, useLocalValue } from '../utils/storage';
import { websiteUrl } from '../utils/urls';
import { isShortcutFolder, moveIntoFolder, parseShortcutEntries, removeShortcutEntry, type ShortcutEntry } from '../utils/shortcutCollections';

const parseShortcuts = (value: unknown) => parseShortcutEntries(value, defaultShortcuts);

export function useShortcuts() {
  const stored = useLocalValue(storageKeys.shortcuts, defaultShortcuts, parseShortcuts);
  const saving = ref(false);
  const error = ref('');

  async function change(update: (current: ShortcutEntry[]) => ShortcutEntry[]) {
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

  async function save(id: string | null, title: string, inputUrl: string, folderId: string | null = null) {
    const url = websiteUrl(inputUrl);
    if (!title.trim() || !url) {
      error.value = 'Enter a name and a valid HTTP or HTTPS URL.';
      return false;
    }
    return change(current => {
      if (folderId && !current.some(item => item.id === folderId && isShortcutFolder(item))) throw new Error('This folder no longer exists.');
      if (id === null) return [...current, { id: crypto.randomUUID(), title: title.trim(), url: url.href, ...(folderId ? { folderId } : {}) }];
      if (!current.some(item => item.id === id)) {
        throw new Error('This shortcut was deleted in another tab.');
      }
      const updated = current.map(item => item.id === id ? { ...item, title: title.trim(), url: url.href } : item);
      const previous = current.find(item => item.id === id);
      if (previous && !isShortcutFolder(previous) && (previous.folderId ?? null) === folderId) return updated;
      return moveIntoFolder(updated, id, folderId);
    });
  }

  function saveFolder(id: string | null, title: string) {
    if (!title.trim()) { error.value = 'Enter a folder name.'; return Promise.resolve(false); }
    return change(current => {
      if (id === null) return [...current, { id: crypto.randomUUID(), title: title.trim(), kind: 'folder' }];
      if (!current.some(item => item.id === id && isShortcutFolder(item))) throw new Error('This folder was deleted in another tab.');
      return current.map(item => item.id === id ? { ...item, title: title.trim() } : item);
    });
  }

  function moveToFolder(id: string, folderId: string | null) {
    return change(current => moveIntoFolder(current, id, folderId));
  }

  function remove(id: string) {
    return change(current => removeShortcutEntry(current, id));
  }

  function move(id: string, position?: ShortcutPosition, beforeId?: string | null) {
    return change(current => {
      const item = current.find(shortcut => shortcut.id === id);
      if (!item) return current;
      const moved = { ...item };
      if (position) {
        moved.position = position;
        if (!isShortcutFolder(moved)) delete moved.folderId;
      }
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

  return { items: stored.value, loading: stored.loading, loadError: stored.error, saving, error, save, saveFolder, remove, move, moveToFolder, resetLayout };
}
