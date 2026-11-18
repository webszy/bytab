import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { browser } from 'wxt/browser';
import { deleteBackground, prepareBackground, readBackground, writeBackground } from '../utils/background-db';
import { storageKeys, updateLocalValue, useLocalValue, withLocalLock } from '../utils/storage';

import { parseAppearance, readGlassTints, type AppearanceSettings, type DockPosition, type GlassMode, type ThemePreference } from '../utils/appearance';

export function useBackground() {
  const stored = useLocalValue<AppearanceSettings>(storageKeys.background, parseAppearance(null), parseAppearance);
  const pendingTheme = ref<ThemePreference>();
  const theme = computed(() => pendingTheme.value ?? stored.value.value.theme);
  const themeError = ref('');
  let themeRevision = 0;
  const systemQuery = matchMedia('(prefers-color-scheme: dark)');
  const systemDark = ref(systemQuery.matches);
  const effectiveTheme = computed<GlassMode>(() => {
    if (theme.value !== 'system') return theme.value;
    return systemDark.value ? 'dark' : 'light';
  });

  function updateSystemTheme() {
    systemDark.value = systemQuery.matches;
  }

  onMounted(() => {
    systemQuery.addEventListener('change', updateSystemTheme);
    updateSystemTheme();
  });

  async function setTheme(preference: ThemePreference) {
    if (stored.loading.value || preference === theme.value) return;
    const revision = ++themeRevision;
    pendingTheme.value = preference;
    themeError.value = '';
    try {
      const next = await updateLocalValue(storageKeys.background, parseAppearance, current => ({
        ...current, theme: preference,
      }));
      if (revision === themeRevision) stored.value.value = next;
    } catch {
      if (revision === themeRevision) themeError.value = 'Could not save theme. Try again.';
    } finally {
      if (revision === themeRevision) pendingTheme.value = undefined;
    }
  }

  const tintPreview = ref<Partial<Record<GlassMode, number>>>({});
  const glassTints = computed(() => ({ ...readGlassTints(stored.value.value), ...tintPreview.value }));
  const tintError = ref('');
  const tintRevision = { light: 0, dark: 0 };

  function previewTint(mode: GlassMode, value: number) {
    tintRevision[mode]++;
    tintPreview.value[mode] = value;
    tintError.value = '';
  }

  async function saveTint(mode: GlassMode, value: number) {
    const revision = ++tintRevision[mode];
    try {
      await updateLocalValue(storageKeys.background, parseAppearance, current => ({
        ...current, glassTints: { ...readGlassTints(current), [mode]: value },
      }));
    } catch {
      if (revision === tintRevision[mode]) tintError.value = 'Could not save glass tint. Try again.';
    } finally {
      if (revision === tintRevision[mode]) delete tintPreview.value[mode];
    }
  }

  const dockSaving = ref(false);
  const dockError = ref('');
  const pendingDock = ref<DockPosition>();
  const dockPosition = computed(() => pendingDock.value ?? stored.value.value.dockPosition);
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

  watch(() => stored.value.value.kind === 'custom' ? stored.value.value.imageId : '', async imageId => {
    const request = ++loadRevision;
    if (!imageId) {
      replaceUrl(activeUrl, '');
      imageError.value = '';
      return;
    }
    try {
      const blob = await readBackground(imageId);
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
        const previous = parseAppearance((await browser.storage.local.get(storageKeys.background))[storageKeys.background]);
        const next: AppearanceSettings = blob
          ? { ...previous, kind: 'custom', imageId: crypto.randomUUID() }
          : parseAppearance({ ...previous, kind: 'default' });
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

  async function setDockPosition(position: DockPosition) {
    if (dockSaving.value || stored.loading.value) return;
    pendingDock.value = position;
    dockSaving.value = true;
    dockError.value = '';
    try {
      await withLocalLock(storageKeys.background, async () => {
        const previous = parseAppearance((await browser.storage.local.get(storageKeys.background))[storageKeys.background]);
        const next = parseAppearance({ ...previous, dockPosition: position });
        await browser.storage.local.set({ [storageKeys.background]: next });
        stored.value.value = next;
      });
    } catch {
      dockError.value = 'Could not save Dock position. Try again.';
    } finally {
      pendingDock.value = undefined;
      dockSaving.value = false;
    }
  }

  async function restoreDefault() {
    selectDefault();
    return apply();
  }

  onBeforeUnmount(() => {
    systemQuery.removeEventListener('change', updateSystemTheme);
    disposed = true;
    loadRevision++;
    pickRevision++;
    replaceUrl(activeUrl, '');
    replaceUrl(draftUrl, '');
  });

  return {
    theme, effectiveTheme, themeError, setTheme,
    glassTints, tintError, previewTint, saveTint,
    dockPosition, dockSaving, dockError, setDockPosition,
    activeUrl, previewUrl, preparing, saving, error: computed(() => error.value || imageError.value),
    loading: stored.loading, loadError: stored.error,
    begin, selectFile, selectDefault, apply, restoreDefault,
  };
}
