<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { BookmarkNode } from '../../composables/useBookmarks';
import { websiteLabel, websiteUrl } from '../../utils/urls';
import HomeIcon from './HomeIcon.vue';

const props = defineProps<{
  bookmarkCount: number | null;
  roots: BookmarkNode[];
  folders: BookmarkNode[];
  nodes: Map<string, BookmarkNode>;
  loading: boolean;
  error: string;
}>();
const emit = defineEmits<{ open: [title: string, url: string]; retry: [] }>();
const dock = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const filterInput = ref<HTMLInputElement | null>(null);
const panelOpen = ref(false);
const selectedId = ref<string | null>(null);
const showMore = ref(false);
const query = ref('');
const view = ref<'grid' | 'list'>('grid');
const limit = ref(100);
const folderColors = ['development', 'design', 'ai', 'work', 'reading'];
let previousFocus: HTMLElement | null = null;

const selected = computed(() => selectedId.value ? props.nodes.get(selectedId.value) : undefined);
const title = computed(() => {
  if (showMore.value) return 'Bookmark folders';
  return selected.value ? selected.value.title || 'Untitled folder' : 'All Bookmarks';
});
const allBookmarks = computed(() => [...props.nodes.values()].filter(node => !!node.url));
const entries = computed(() => {
  if (showMore.value) return props.folders;
  if (selected.value) return selected.value.children ?? [];
  return [...props.roots.filter(node => !node.url), ...allBookmarks.value];
});
const filtered = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  if (!text) return entries.value;
  const candidates: BookmarkNode[] = [];
  const remaining = [...entries.value];
  const seen = new Set<string>();
  while (remaining.length) {
    const node = remaining.pop()!;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    candidates.push(node);
    if (node.children) {
      for (const child of node.children) remaining.push(child);
    }
  }
  return candidates.filter(node => `${node.title} ${node.url ?? ''}`.toLocaleLowerCase().includes(text));
});

watch([selectedId, showMore, query], () => { limit.value = 100; });
watch(() => props.nodes, nodes => {
  if (selectedId.value && !nodes.has(selectedId.value)) selectedId.value = null;
});

async function openFolder(id: string | null, more = false) {
  if (!panelOpen.value) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  selectedId.value = id;
  showMore.value = more;
  query.value = '';
  panelOpen.value = true;
  await nextTick();
  panel.value?.focus();
}

function close() {
  panelOpen.value = false;
  previousFocus?.focus();
}

function back() {
  if (showMore.value) {
    showMore.value = false;
    query.value = '';
    return;
  }
  const parent = selected.value?.parentId ? props.nodes.get(selected.value.parentId) : undefined;
  void openFolder(parent?.parentId === undefined ? null : parent.id);
}

function openEntry(node: BookmarkNode) {
  if (!node.url) void openFolder(node.id);
  else emit('open', node.title, node.url);
}

async function filter() {
  if (!panelOpen.value) await openFolder(null);
  await nextTick();
  filterInput.value?.focus();
}

function onOutside(event: PointerEvent) {
  if (panelOpen.value && event.target instanceof Node && !dock.value?.contains(event.target)) {
    panelOpen.value = false;
  }
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && panelOpen.value) close();
}

onMounted(() => {
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('keydown', onEscape);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside);
  document.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <footer ref="dock" class="bookmark-dock" aria-label="Bookmark dock">
    <section v-if="panelOpen" ref="panel" class="bookmark-panel" tabindex="-1" :aria-label="title">
      <header class="bookmark-panel-heading">
        <button v-if="selectedId || showMore" class="text-action" type="button" aria-label="Back to parent folder" @click="back">← Back</button>
        <h2>{{ title }}</h2>
        <button class="dialog-close" type="button" aria-label="Close bookmarks" @click="close">×</button>
      </header>
      <input ref="filterInput" v-model="query" class="bookmark-search" type="search" placeholder="Filter bookmarks and folders" aria-label="Filter bookmarks and folders" />
      <p v-if="error" class="bookmark-message" role="status">{{ error }} <button class="text-action" type="button" @click="emit('retry')">Try again</button></p>
      <p v-if="loading" class="bookmark-message" role="status">Loading bookmarks…</p>
      <p v-else-if="filtered.length === 0" class="bookmark-message">{{ query ? 'No matching bookmarks or folders' : selectedId ? 'This folder is empty' : 'No bookmarks yet' }}</p>
      <div v-else class="bookmark-entries" :class="`bookmark-entries--${view}`">
        <button
          v-for="node in filtered.slice(0, limit)"
          :key="node.id"
          class="bookmark-entry"
          type="button"
          :disabled="!!node.url && !websiteUrl(node.url)"
          :title="node.url || node.title"
          @click="openEntry(node)"
        >
          <span class="bookmark-entry-icon"><HomeIcon :name="node.url ? 'arrowUpRight' : 'bookmark'" /></span>
          <span class="bookmark-entry-copy">
            <span>{{ node.title || (node.url ? websiteLabel(node.url) || node.url : 'Untitled folder') }}</span>
            <small>{{ node.url ? websiteLabel(node.url) || 'Unsupported address' : `${node.children?.length ?? 0} items` }}</small>
          </span>
          <HomeIcon v-if="!node.url" name="chevron" class="bookmark-folder-chevron" />
        </button>
      </div>
      <button v-if="filtered.length > limit" class="text-action bookmark-load-more" type="button" @click="limit += 100">Show more · {{ (filtered.length - limit).toLocaleString() }} remaining</button>
    </section>
    <div class="dock-surface" aria-hidden="true" />
    <div class="dock-content">
      <div class="dock-root-group">
        <button class="dock-root dock-item" type="button" :aria-expanded="panelOpen && selectedId === null && !showMore" @click="openFolder(null)">
          <span class="dock-root-icon"><HomeIcon name="bookmark" /></span>
          <span class="dock-root-copy">
            <span class="dock-root-title">All Bookmarks <span class="dock-count">{{ bookmarkCount === null ? '—' : bookmarkCount.toLocaleString() }}</span></span>
            <span class="dock-root-subtitle">Browse folders</span>
          </span>
        </button>
        <span class="dock-divider" aria-hidden="true" />
      </div>

      <nav class="dock-navigation" aria-label="Bookmark folders" tabindex="0">
        <button
          v-for="(folder, index) in folders.slice(0, 5)"
          :key="folder.id"
          class="dock-folder dock-item"
          :class="`dock-folder--${folderColors[index]}`"
          type="button"
          :title="folder.title || 'Untitled folder'"
          :aria-expanded="panelOpen && selectedId === folder.id"
          @click="openFolder(folder.id)"
        >
          <span class="dock-folder-icon"><HomeIcon name="bookmark" /></span>
          <span class="dock-folder-label">{{ folder.title || 'Untitled folder' }}</span>
        </button>
        <button v-if="folders.length > 5" class="dock-folder dock-item dock-folder--more" type="button" :aria-expanded="panelOpen && showMore" @click="openFolder(null, true)">
          <span class="dock-folder-icon"><HomeIcon name="more" /></span>
          <span>More ({{ folders.length - 5 }})</span>
        </button>
      </nav>

      <div class="dock-tools">
        <button class="dock-filter" type="button" @click="filter"><HomeIcon name="search" /><span>Filter</span></button>
        <div class="dock-view-switch" role="group" aria-label="Bookmark view">
          <button :class="{ 'is-selected': view === 'grid' }" type="button" :aria-pressed="view === 'grid'" title="Grid view" @click="view = 'grid'"><HomeIcon name="grid" /><span class="sr-only">Grid view</span></button>
          <button :class="{ 'is-selected': view === 'list' }" type="button" :aria-pressed="view === 'list'" title="List view" @click="view = 'list'"><HomeIcon name="list" /><span class="sr-only">List view</span></button>
        </div>
      </div>
    </div>
  </footer>
</template>
