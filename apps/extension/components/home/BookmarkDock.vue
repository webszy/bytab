<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { BookmarkCatalog } from '../../utils/bookmarkTree';
import { folderLabel } from '../../utils/bookmarkTree';
import BookmarkPanel from './BookmarkPanel.vue';
import HomeIcon from './HomeIcon.vue';

const props = defineProps<{
  bookmarkCount: number | null;
  catalog: BookmarkCatalog;
  loading: boolean;
  error: string;
}>();
const emit = defineEmits<{ open: [title: string, url: string]; retry: [] }>();
const dock = ref<HTMLElement | null>(null);
const navigation = ref<HTMLElement | null>(null);
const panel = ref<InstanceType<typeof BookmarkPanel> | null>(null);
const panelOpen = ref(false);
const selectedId = ref<string | null>(null);
const showMore = ref(false);
const view = ref<'grid' | 'list'>('grid');
const capacity = ref(0);
const folderColors = ['development', 'design', 'ai', 'work', 'reading'];
let previousFocus: HTMLElement | null = null;
let resizeObserver: ResizeObserver | undefined;

const visibleCount = computed(() => props.catalog.folders.length > capacity.value
  ? Math.max(0, capacity.value - 1) : capacity.value);
const visibleFolders = computed(() => props.catalog.folders.slice(0, visibleCount.value));
const overflowFolders = computed(() => props.catalog.folders.slice(visibleCount.value));
const panelKey = computed(() => showMore.value ? 'more' : `folder:${selectedId.value}`);

function measureCategories() {
  const element = navigation.value;
  if (!element) return;
  const style = getComputedStyle(element);
  const gap = parseFloat(style.columnGap) || 0;
  const width = parseFloat(style.getPropertyValue('--dock-folder-size')) || 96;
  capacity.value = Math.max(0, Math.floor((element.clientWidth + gap) / (width + gap)));
}

async function openCategory(id: string | null, more = false, search = false) {
  if (document.activeElement instanceof HTMLElement && dock.value?.contains(document.activeElement)) {
    previousFocus = document.activeElement;
  }
  selectedId.value = id;
  showMore.value = more;
  panelOpen.value = true;
  await nextTick();
  if (search) panel.value?.focusSearch();
  else panel.value?.focus();
}

function toggleCategory(id: string | null, more = false) {
  if (panelOpen.value && selectedId.value === id && showMore.value === more) close();
  else void openCategory(id, more);
}

function close(restoreFocus = true) {
  panelOpen.value = false;
  if (restoreFocus && previousFocus?.isConnected) previousFocus.focus();
}

async function filter() {
  if (!panelOpen.value) await openCategory(null, false, true);
  else panel.value?.focusSearch();
}

async function changeView(value: 'grid' | 'list') {
  view.value = value;
  if (!panelOpen.value) await openCategory(null);
}

function onOutside(event: PointerEvent) {
  if (panelOpen.value && event.target instanceof Node && !dock.value?.contains(event.target)) close(false);
}

function onEscape(event: KeyboardEvent) {
  // The panel handles search first. Do not consume another input's shortcuts.
  if (event.key === 'Escape' && !event.defaultPrevented && !event.isComposing && panelOpen.value
    && (event.target === document.body || (event.target instanceof Node && dock.value?.contains(event.target)))) {
    event.preventDefault();
    close();
  }
}

onMounted(() => {
  measureCategories();
  resizeObserver = new ResizeObserver(measureCategories);
  if (navigation.value) resizeObserver.observe(navigation.value);
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('keydown', onEscape);
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  document.removeEventListener('pointerdown', onOutside);
  document.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <footer ref="dock" class="bookmark-dock" aria-label="Bookmark dock">
    <BookmarkPanel
      v-if="panelOpen"
      id="bookmark-panel"
      ref="panel"
      :key="panelKey"
      :catalog="catalog"
      :folder-id="selectedId"
      :more="showMore"
      :overflow-folders="overflowFolders"
      :view="view"
      :loading="loading"
      :error="error"
      @open="(title, url) => emit('open', title, url)"
      @close="close"
      @retry="emit('retry')"
    />
    <div class="dock-surface" aria-hidden="true" />
    <div class="dock-content">
      <div class="dock-root-group">
        <button class="dock-root dock-item" type="button" aria-label="All Bookmarks" aria-controls="bookmark-panel" :aria-expanded="panelOpen && selectedId === null && !showMore" @click="toggleCategory(null)">
          <span class="dock-root-icon"><HomeIcon name="bookmark" /></span>
          <span class="dock-root-copy">
            <span class="dock-root-title">All Bookmarks <span class="dock-count">{{ bookmarkCount === null ? '—' : bookmarkCount.toLocaleString() }}</span></span>
            <span class="dock-root-subtitle">Browse folders</span>
          </span>
        </button>
        <span class="dock-divider" aria-hidden="true" />
      </div>

      <nav ref="navigation" class="dock-navigation" aria-label="Bookmark folders">
        <button
          v-for="(folder, index) in visibleFolders"
          :key="folder.id"
          class="dock-folder dock-item"
          :class="`dock-folder--${folderColors[index % folderColors.length]}`"
          type="button"
          :title="folderLabel(folder)"
          aria-controls="bookmark-panel"
          :aria-expanded="panelOpen && selectedId === folder.id && !showMore"
          @click="toggleCategory(folder.id)"
        >
          <span class="dock-folder-icon"><HomeIcon name="folder" /></span>
          <span class="dock-folder-label">{{ folderLabel(folder) }}</span>
        </button>
        <button v-if="overflowFolders.length" class="dock-folder dock-item dock-folder--more" type="button" aria-controls="bookmark-panel" :aria-expanded="panelOpen && showMore" @click="toggleCategory(null, true)">
          <span class="dock-folder-icon"><HomeIcon name="more" /></span>
          <span class="dock-folder-label">More ({{ overflowFolders.length }})</span>
        </button>
      </nav>

      <div class="dock-tools">
        <button class="dock-filter" type="button" aria-label="Search bookmarks" aria-controls="bookmark-panel" @click="filter"><HomeIcon name="search" /><span>Filter</span></button>
        <div class="dock-view-switch" role="group" aria-label="Bookmark view">
          <button :class="{ 'is-selected': view === 'grid' }" type="button" :aria-pressed="view === 'grid'" title="Grid view" @click="changeView('grid')"><HomeIcon name="grid" /><span class="sr-only">Grid view</span></button>
          <button :class="{ 'is-selected': view === 'list' }" type="button" :aria-pressed="view === 'list'" title="List view" @click="changeView('list')"><HomeIcon name="list" /><span class="sr-only">List view</span></button>
        </div>
      </div>
    </div>
  </footer>
</template>
