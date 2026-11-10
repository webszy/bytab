import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { browser } from 'wxt/browser';
import { deleteBackground, prepareBackground, readBackground, writeBackground } from '../utils/background-db';
import { isRecord, storageKeys, useLocalValue, withLocalLock } from '../utils/storage';

type BackgroundSettings = { kind: 'default' } | { kind: 'custom'; imageId: string };

function parseBackground(value: unknown): BackgroundSettings {
  if (isRecord(value) && value.kind === 'custom' && typeof value.imageId === 'string' && value.imageId) {
    return { kind: 'custom', imageId: value.imageId };
  }
  return { kind: 'default' };
}

export function useBackground() {
  const stored = useLocalValue<BackgroundSettings>(storageKeys.background, { kind: 'default' }, parseBackground);
  const activeUrl = ref('');
  const draftUrl = ref('');
  const draftBlob = shallowRef<Blob | null>(null);
  const draftKind = ref<'unchanged' | 'default' | 'custom'>('unchanged');
  const preparing = ref(false);
  const saving = ref(false);
  const error = ref('');
  const imageError = ref('');
  let loadRevision = 0;
  let pickRevision = 0;
  let disposed = false;
  const previewUrl = computed(() => {
    if (draftKind.value === 'default') return '';
    return draftKind.value === 'custom' ? draftUrl.value : activeUrl.value;
  });

  function replaceUrl(target: typeof activeUrl, next: string) {
    const previous = target.value;
    target.value = next;
    if (previous) URL.revokeObjectURL(previous);
  }

  watch(stored.value, async settings => {
    const request = ++loadRevision;
    if (settings.kind === 'default') {
      replaceUrl(activeUrl, '');
      imageError.value = '';
      return;
    }
    try {
      const blob = await readBackground(settings.imageId);
      if (!(blob instanceof Blob)) throw new Error('The saved image is missing.');
      const bitmap = await createImageBitmap(blob);
      bitmap.close();
      if (disposed || request !== loadRevision) return;
      replaceUrl(activeUrl, URL.createObjectURL(blob));
      imageError.value = '';
    } catch {
      if (disposed || request !== loadRevision) return;
      replaceUrl(activeUrl, '');
      imageError.value = 'The saved background could not be loaded. Choose another image or restore the default.';
    }
  });

  function begin() {
    pickRevision++;
    preparing.value = false;
    draftKind.value = 'unchanged';
    draftBlob.value = null;
    replaceUrl(draftUrl, '');
    error.value = '';
  }

  async function selectFile(file: File) {
    const request = ++pickRevision;
    preparing.value = true;
    error.value = '';
    try {
      const blob = await prepareBackground(file);
      if (disposed || request !== pickRevision) return;
      draftBlob.value = blob;
      replaceUrl(draftUrl, URL.createObjectURL(blob));
      draftKind.value = 'custom';
    } catch (cause) {
      if (!disposed && request === pickRevision) {
        error.value = cause instanceof Error ? cause.message : 'Could not prepare this image.';
      }
    } finally {
      if (!disposed && request === pickRevision) preparing.value = false;
    }
  }

  function selectDefault() {
    begin();
    draftKind.value = 'default';
  }

  async function apply() {
    if (saving.value || preparing.value || stored.loading.value) return false;
    if (draftKind.value === 'unchanged') return true;
    const blob = draftKind.value === 'custom' ? draftBlob.value : null;
    if (draftKind.value === 'custom' && !blob) return false;
    saving.value = true;
    error.value = '';
    try {
      await withLocalLock(storageKeys.background, async () => {
        const previous = parseBackground((await browser.storage.local.get(storageKeys.background))[storageKeys.background]);
        const next: BackgroundSettings = blob
          ? { kind: 'custom', imageId: crypto.randomUUID() }
          : { kind: 'default' };
        if (next.kind === 'custom' && blob) await writeBackground(next.imageId, blob);
        try {
          await browser.storage.local.set({ [storageKeys.background]: next });
        } catch (cause) {
          if (next.kind === 'custom') await deleteBackground(next.imageId).catch(() => {});
          throw cause;
        }
        stored.value.value = next;
        if (previous.kind === 'custom') await deleteBackground(previous.imageId).catch(() => {});
      });
      begin();
      return true;
    } catch {
      error.value = 'Could not save the background. Check available disk space and try again.';
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function restoreDefault() {
    selectDefault();
    return apply();
  }

  onBeforeUnmount(() => {
    disposed = true;
    loadRevision++;
    pickRevision++;
    replaceUrl(activeUrl, '');
    replaceUrl(draftUrl, '');
  });

  return {
    activeUrl, previewUrl, preparing, saving, error: computed(() => error.value || imageError.value),
    loading: stored.loading, loadError: stored.error,
    begin, selectFile, selectDefault, apply, restoreDefault,
  };
}
