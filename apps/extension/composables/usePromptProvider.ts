import { browser } from 'wxt/browser';
import { ref, watch } from 'vue';
import { parsePromptProvider } from '../utils/promptProviders';
import { storageKeys, useLocalValue } from '../utils/storage';

export function usePromptProvider() {
  const setting = useLocalValue(storageKeys.promptProvider, 'chatgpt', parsePromptProvider);
  const value = ref(setting.value.value);
  const saveError = ref('');
  let pending = Promise.resolve();
  let pendingWrites = 0;
  watch(setting.value, next => {
    if (!pendingWrites) value.value = next;
  }, { flush: 'sync' });

  function select(id: unknown) {
    const next = parsePromptProvider(id);
    value.value = next;
    saveError.value = '';
    pendingWrites++;
    // Keep rapid selections in order; a failed write must not block later ones.
    pending = pending.catch(() => {}).then(async () => {
      try {
        await browser.storage.local.set({ [storageKeys.promptProvider]: next });
      } catch {
        saveError.value = 'Could not save your provider. Your selection applies to this tab only.';
      } finally {
        pendingWrites--;
      }
    });
  }

  return { ...setting, value, select, saveError };
}
