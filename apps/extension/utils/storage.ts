import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { browser, type Browser } from 'wxt/browser';

export const storageKeys = {
  lastOpened: 'bytab.lastOpened',
  shortcuts: 'bytab.shortcuts',
  background: 'bytab.background',
} as const;

export function useLocalValue<T>(key: string, initial: T, parse: (value: unknown) => T) {
  const value = shallowRef<T>(initial);
  const loading = ref(true);
  const error = ref('');
  let revision = 0;
  let disposed = false;

  function onChanged(changes: Record<string, Browser.storage.StorageChange>, area: string) {
    if (area !== 'local' || !Object.hasOwn(changes, key)) return;
    revision++;
    value.value = parse(changes[key]?.newValue);
    error.value = '';
  }

  onMounted(async () => {
    browser.storage.onChanged.addListener(onChanged);
    const requestedRevision = revision;
    try {
      const stored = await browser.storage.local.get(key);
      if (!disposed && revision === requestedRevision) value.value = parse(stored[key]);
    } catch {
      if (!disposed) error.value = 'Could not read local settings. Reopen this tab to retry.';
    } finally {
      if (!disposed) loading.value = false;
    }
  });

  onBeforeUnmount(() => {
    disposed = true;
    browser.storage.onChanged.removeListener(onChanged);
  });

  return { value, loading, error };
}

// Web Locks serialize read/modify/write operations across New Tab documents.
export async function withLocalLock<T>(key: string, action: () => Promise<T>): Promise<T> {
  return await navigator.locks.request(key, action);
}

export function updateLocalValue<T>(
  key: string,
  parse: (value: unknown) => T,
  update: (current: T) => T,
) {
  return withLocalLock(key, async () => {
    const stored = await browser.storage.local.get(key);
    const next = update(parse(stored[key]));
    await browser.storage.local.set({ [key]: next });
    return next;
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
