import { ref } from 'vue';
import { parseShortcutBar, type ShortcutBarLayout } from '../utils/shortcutCollections';
import { storageKeys, updateLocalValue, useLocalValue } from '../utils/storage';

export function useShortcutBar() {
  const stored = useLocalValue(storageKeys.shortcutBar, { pinned: false }, parseShortcutBar);
  const saving = ref(false);
  const error = ref('');
  async function save(layout: ShortcutBarLayout) {
    if (saving.value) return;
    saving.value = true;
    error.value = '';
    try {
      stored.value.value = await updateLocalValue(storageKeys.shortcutBar, parseShortcutBar, () => parseShortcutBar(layout));
    } catch {
      error.value = 'Could not save the shortcuts bar position. Try again.';
    } finally { saving.value = false; }
  }
  return { layout: stored.value, loading: stored.loading, loadError: stored.error, saving, error, save };
}
