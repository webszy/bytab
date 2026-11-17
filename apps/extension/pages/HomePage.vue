<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import BackgroundSettings from '@/components/home/BackgroundSettings.vue';
import BookmarkDock from '@/components/home/BookmarkDock.vue';
import HolidayInfo from '@/components/home/HolidayInfo.vue';
import HomeClock from '@/components/home/HomeClock.vue';
import HomeTopBar from '@/components/home/HomeTopBar.vue';
import ExtensionPromptBar from '@/components/home/ExtensionPromptBar.vue';
import RecentPagesRow from '@/components/home/RecentPagesRow.vue';
import ShortcutEditor from '@/components/home/ShortcutEditor.vue';
import ShortcutsPanel from '@/components/home/ShortcutsPanel.vue';
import { useBackground } from '@/composables/useBackground';
import { useBookmarks } from '@/composables/useBookmarks';
import { useClock } from '@/composables/useClock';
import { useLastClosed } from '@/composables/useLastClosed';
import { useLastOpened } from '@/composables/useLastOpened';
import { useShortcutBar } from '@/composables/useShortcutBar';
import { useShortcuts } from '@/composables/useShortcuts';
import { holidayLabel } from '@/utils/holidays';
import { openWebsite } from '@/utils/navigation';
import { isShortcutFolder, type ShortcutEntry } from '@/utils/shortcutCollections';
import '@/assets/styles/home.css';
import '@/assets/styles/interactions.css';
import '@/assets/styles/dock-position.css';

const bookmarks = useBookmarks();
const { catalog, bookmarkCount, loading: bookmarksLoading, error: bookmarksError } = bookmarks;
const { now, time, date, locale } = useClock();
const holiday = computed(() => holidayLabel(now.value, locale));
const { value: lastOpened, loading: openedLoading, error: openedError } = useLastOpened();
const closed = useLastClosed();
const { session: closedSession, title: closedTitle, hostname: closedHostname, loading: closedLoading, restoring, error: closedError } = closed;
const background = useBackground();
const { dockPosition, dockSaving, dockError, activeUrl, previewUrl, preparing, saving: backgroundSaving, loading: backgroundLoading, error: backgroundError, loadError: backgroundLoadError } = background;
const shortcuts = useShortcuts();
const { items: shortcutItems, loading: shortcutsLoading, saving: shortcutsSaving, error: shortcutsError, loadError: shortcutsLoadError } = shortcuts;
const bar = useShortcutBar();
const { layout: barLayout, saving: barSaving, loading: barLoading, error: barError, loadError: barLoadError } = bar;
const shortcutFolders = computed(() => shortcutItems.value.filter(isShortcutFolder));
const newFolder = ref(false);
const newShortcutFolderId = ref<string | null>(null);
const settingsOpen = ref(false);
const editorOpen = ref(false);
const editingShortcut = shallowRef<ShortcutEntry | null>(null);
const navigationError = ref('');
const notice = computed(() => navigationError.value || shortcutsLoadError.value || barError.value || barLoadError.value
  || (!editorOpen.value && shortcutsError.value)
  || (!settingsOpen.value && (backgroundError.value || backgroundLoadError.value)));

async function openSite(title: string, url: string) {
  navigationError.value = '';
  try {
    await openWebsite(title, url);
  } catch (cause) {
    navigationError.value = cause instanceof Error ? cause.message : 'Could not open this website. Try again.';
  }
}

function openSettings() {
  background.begin();
  settingsOpen.value = true;
}

function closeSettings() {
  background.begin();
  settingsOpen.value = false;
}

async function applyBackground() {
  if (await background.apply()) closeSettings();
}

async function restoreBackground() {
  if (await background.restoreDefault()) closeSettings();
}

function editShortcut(shortcut: ShortcutEntry | null, folder = false, folderId: string | null = null) {
  editingShortcut.value = shortcut;
  newFolder.value = folder || !!(shortcut && isShortcutFolder(shortcut));
  newShortcutFolderId.value = folderId;
  shortcutsError.value = '';
  editorOpen.value = true;
}

async function saveShortcut(title: string, url: string, folderId: string | null) {
  const saved = newFolder.value
    ? await shortcuts.saveFolder(editingShortcut.value?.id ?? null, title)
    : await shortcuts.save(editingShortcut.value?.id ?? null, title, url, folderId);
  if (saved) editorOpen.value = false;
}

function openShortcut(item: ShortcutEntry) {
  if (!isShortcutFolder(item)) void openSite(item.title, item.url);
}

async function resetShortcuts() {
  await shortcuts.resetLayout();
  await bar.save({ pinned: false });
}

async function removeShortcut() {
  if (editingShortcut.value && await shortcuts.remove(editingShortcut.value.id)) editorOpen.value = false;
}

async function alignShortcut() {
  if (editingShortcut.value && await shortcuts.move(editingShortcut.value.id)) editorOpen.value = false;
}
</script>

<template>
  <div class="home-page" :data-dock-position="dockPosition" :style="activeUrl ? { '--home-wallpaper': `url('${activeUrl}')` } : undefined">
    <div class="home-background" aria-hidden="true" />
    <HomeTopBar :bookmark-count="bookmarkCount" :bookmarks-unavailable="!!bookmarksError" @settings="openSettings" />
    <div id="home-shortcut-layer" class="shortcut-layout" />
    <p v-if="notice" class="home-notice" role="status">{{ notice }}</p>
    <main class="home-main">
      <HomeClock :time="time" :date="date" />
      <HolidayInfo :label="holiday" confirmed />
      <RecentPagesRow
        :opened="lastOpened"
        :opened-loading="openedLoading"
        :opened-error="openedError"
        :closed-title="closedTitle"
        :closed-subtitle="closedHostname"
        :has-closed-tab="!!closedSession"
        :closed-loading="closedLoading"
        :restoring="restoring"
        :closed-error="closedError"
        @reopen="lastOpened && openSite(lastOpened.title, lastOpened.url)"
        @restore="closedSession ? closed.restore() : closed.refresh()"
      />
      <ExtensionPromptBar :bookmarks="bookmarksError ? [] : catalog.searchIndex" />
      <ShortcutsPanel
        enabled
        :shortcuts="shortcutItems"
        :loading="shortcutsLoading"
        :busy="shortcutsSaving"
        :bar-layout="barLayout"
        :bar-busy="barSaving || barLoading"
        layout-target="#home-shortcut-layer"
        @open="openShortcut"
        @add="editShortcut(null, false, $event)"
        @add-folder="editShortcut(null, true)"
        @save-bar="bar.save"
        @move-to-folder="shortcuts.moveToFolder"
        @edit="editShortcut"
        @move="shortcuts.move"
        @reset-layout="resetShortcuts"
      />
    </main>
    <div class="home-bottom-buffer" aria-hidden="true" />
    <BookmarkDock
      :position="dockPosition"
      :bookmark-count="bookmarkCount"
      :catalog="catalog"
      :loading="bookmarksLoading"
      :error="bookmarksError"
      @open="openSite"
      @retry="bookmarks.refresh"
    />
    <BackgroundSettings
      v-if="settingsOpen"
      :dock-position="dockPosition"
      :dock-saving="dockSaving"
      :dock-error="dockError"
      @position="background.setDockPosition"
      :preview-url="previewUrl"
      :preparing="preparing"
      :saving="backgroundSaving"
      :loading="backgroundLoading"
      :error="backgroundError || backgroundLoadError"
      @close="closeSettings"
      @file="background.selectFile"
      @default="background.selectDefault"
      @apply="applyBackground"
      @restore="restoreBackground"
    />
    <ShortcutEditor
      v-if="editorOpen"
      :shortcut="editingShortcut"
      :folder="newFolder"
      :folder-id="newShortcutFolderId"
      :folders="shortcutFolders"
      :saving="shortcutsSaving"
      :error="shortcutsError"
      @close="editorOpen = false"
      @save="saveShortcut"
      @remove="removeShortcut"
      @align="alignShortcut"
    />
  </div>
</template>

<style scoped>
/* Let the Prompt Bar's own z-index sit above detached shortcut tiles (25)
   while retaining the Dock (40) and dialog layers above it. No layout changes. */
.home-main { z-index: auto; }
</style>
