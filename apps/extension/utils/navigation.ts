import { browser } from 'wxt/browser';
import { isRecord, storageKeys, withLocalLock } from './storage';
import { websiteUrl } from './urls';

export interface LastOpened {
  title: string;
  url: string;
  openedAt: number;
}

export function parseLastOpened(value: unknown): LastOpened | null {
  if (!isRecord(value) || typeof value.url !== 'string' || !websiteUrl(value.url)) return null;
  if (typeof value.title !== 'string' || typeof value.openedAt !== 'number'
    || !Number.isFinite(value.openedAt) || value.openedAt <= 0) return null;
  return { title: value.title.trim() || websiteUrl(value.url)!.hostname, url: value.url, openedAt: value.openedAt };
}

export async function openWebsite(title: string, target: string, recordUrl = target) {
  const url = websiteUrl(target);
  const recorded = websiteUrl(recordUrl);
  if (!url || !recorded) throw new Error('Enter a valid HTTP or HTTPS website URL.');

  const openedAt = Date.now();
  let lockEntered = false;
  try {
    await withLocalLock(storageKeys.lastOpened, async () => {
      lockEntered = true;
      let previous: Record<string, unknown> | undefined;
      let written = false;
      try {
        const stored = await browser.storage.local.get(storageKeys.lastOpened);
        previous = stored;
        const current = parseLastOpened(stored[storageKeys.lastOpened]);
        if (!current || current.openedAt <= openedAt) {
          await browser.storage.local.set({
            [storageKeys.lastOpened]: { title: title.trim() || recorded.hostname, url: recorded.href, openedAt },
          });
          written = true;
        }
      } catch {
        // A storage failure must not prevent the primary navigation.
      }
      try {
        // Creating a tab does not require the sensitive "tabs" permission.
        await browser.tabs.create({ url: url.href });
      } catch (cause) {
        // The lock keeps rollback from overwriting another New Tab's newer record.
        if (written && previous) {
          const value = previous[storageKeys.lastOpened];
          const rollback = value === undefined
            ? browser.storage.local.remove(storageKeys.lastOpened)
            : browser.storage.local.set({ [storageKeys.lastOpened]: value });
          await rollback.catch(() => {});
        }
        throw cause;
      }
    });
  } catch (cause) {
    if (lockEntered) throw cause;
    // Navigation also remains available if local locking itself is unavailable.
    await browser.tabs.create({ url: url.href });
  }
}
