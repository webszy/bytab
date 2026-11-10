<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  folderLabel, folderTrail, isBookmark, searchBookmarks, survivingFolder,
  type BookmarkCatalog, type BookmarkNode,
} from '../../utils/bookmarkTree';
import { websiteUrl } from '../../utils/urls';
import BookmarkItem from './BookmarkItem.vue';

const props = defineProps<{
  catalog: BookmarkCatalog;
  folderId: string | null;
  more: boolean;
  overflowFolders: BookmarkNode[];
  view: 'grid' | 'list';
  loading: boolean;
  error: string;
}>();
const emit = defineEmits<{
  open: [title: string, url: string];
  close: [];
  retry: [];
}>();
const panel = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const content = ref<HTMLElement | null>(null);
const currentId = ref(props.folderId);
const moreView = ref(props.more);
const query = ref('');
const feedback = ref('');
const limit = ref(100);
const activeIndex = ref(0);
const searching = computed(() => !!query.value.trim());
const trail = computed(() => folderTrail(props.catalog, currentId.value));
const current = computed(() => currentId.value === null ? undefined : props.catalog.nodes.get(currentId.value));
const title = computed(() => moreView.value ? 'More folders' : current.value ? folderLabel(current.value) : 'All Bookmarks');
const results = computed(() => searchBookmarks(props.catalog.searchIndex, query.value));
const entries = computed(() => searching.value
  ? results.value.map(entry => entry.node)
  : moreView.value ? props.overflowFolders : current.value ? current.value.children ?? [] : props.catalog.roots);
const visibleEntries = computed(() => entries.value.slice(0, limit.value));
const activeId = computed(() => searching.value ? entries.value[activeIndex.value]?.id : undefined);
const searchPaths = computed(() => new Map(results.value.map(entry => [entry.node.id, entry.folderPath])));
const emptyMessage = computed(() => searching.value ? 'No matching bookmarks'
  : current.value ? 'This folder is empty' : moreView.value ? 'No more folders' : 'No bookmarks yet');
const resultId = (id: string) => `bookmark-result-${encodeURIComponent(id)}`;

watch(() => props.catalog, (catalog, previous) => {
  if (currentId.value !== null) {
    currentId.value = survivingFolder(catalog, folderTrail(previous, currentId.value));
  }
});
watch([query, currentId, moreView], () => {
  limit.value = 100;
  activeIndex.value = 0;
  feedback.value = '';
  if (content.value) content.value.scrollTop = 0;
});
watch(entries, entries => {
  activeIndex.value = Math.min(activeIndex.value, Math.max(0, entries.length - 1));
});

function navigate(id: string | null) {
  currentId.value = id;
  moreView.value = false;
  query.value = '';
  void nextTick(() => panel.value?.focus());
}

function back() {
  navigate(currentId.value === null ? null : props.catalog.parents.get(currentId.value) ?? null);
}

function openEntry(node: BookmarkNode) {
  if (!isBookmark(node)) {
    navigate(node.id);
  } else if (!websiteUrl(node.url ?? '')) {
    feedback.value = 'This bookmark has an unsupported or invalid URL.';
  } else {
    feedback.value = '';
    emit('open', node.title, node.url!);
  }
}

function clearSearch() {
  query.value = '';
  searchInput.value?.focus();
}

function loadMore() {
  limit.value = Math.min(limit.value + 100, entries.value.length);
}

function onScroll() {
  const element = content.value;
  if (element && element.scrollHeight - element.scrollTop - element.clientHeight < 120) loadMore();
}

async function selectResult(offset: number) {
  if (!entries.value.length) return;
  activeIndex.value = (activeIndex.value + offset + entries.value.length) % entries.value.length;
  if (activeIndex.value >= limit.value) limit.value = Math.ceil((activeIndex.value + 1) / 100) * 100;
  await nextTick();
  content.value?.querySelectorAll<HTMLButtonElement>('.bookmark-entry')[activeIndex.value]?.scrollIntoView({ block: 'nearest' });
}

function onKeydown(event: KeyboardEvent) {
  if (event.isComposing || event.defaultPrevented) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    if (query.value) clearSearch();
    else emit('close');
    return;
  }
  if (!searching.value || event.target !== searchInput.value) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    void selectResult(event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Enter' && !props.loading && !props.error) {
    event.preventDefault();
    const node = entries.value[activeIndex.value];
    if (node) openEntry(node);
  }
}

defineExpose({
  focus: () => panel.value?.focus(),
  focusSearch: () => searchInput.value?.focus(),
});
</script>

<template>
  <section ref="panel" class="bookmark-panel" tabindex="-1" :aria-label="title" @keydown="onKeydown">
    <header class="bookmark-panel-heading">
      <button v-if="currentId !== null || moreView" class="text-action bookmark-back" type="button" aria-label="Back to parent folder" @click="back">← Back</button>
      <h2>{{ title }}</h2>
      <button class="dialog-close" type="button" aria-label="Close bookmarks" @click="emit('close')">×</button>
    </header>
    <nav class="bookmark-breadcrumb" aria-label="Bookmark path">
      <button type="button" :aria-current="currentId === null && !moreView ? 'location' : undefined" @click="navigate(null)">All Bookmarks</button>
      <template v-for="folder in trail" :key="folder.id">
        <span aria-hidden="true">/</span>
        <button type="button" :title="folderLabel(folder)" :aria-current="folder.id === currentId ? 'location' : undefined" @click="navigate(folder.id)">{{ folderLabel(folder) }}</button>
      </template>
      <template v-if="moreView"><span aria-hidden="true">/</span><span aria-current="location">More folders</span></template>
    </nav>
    <div class="bookmark-search-row">
      <input
        ref="searchInput"
        v-model="query"
        class="bookmark-search"
        type="search"
        role="combobox"
        placeholder="Search bookmarks..."
        aria-label="Search all bookmarks"
        aria-autocomplete="list"
        :aria-expanded="searching && !loading && !error && entries.length > 0"
        aria-controls="bookmark-results"
        :aria-activedescendant="!loading && !error && activeId !== undefined ? resultId(activeId) : undefined"
        autocomplete="off"
        spellcheck="false"
      />
      <button v-if="query" class="bookmark-search-clear" type="button" aria-label="Clear bookmark search" @click="clearSearch">×</button>
    </div>
    <p v-if="searching && !loading && !error" class="bookmark-result-status" role="status">{{ entries.length.toLocaleString() }} {{ entries.length === 1 ? 'result' : 'results' }} · All Bookmarks</p>
    <p v-if="feedback" class="bookmark-feedback" role="status">{{ feedback }}</p>
    <div ref="content" class="bookmark-content" :aria-busy="loading" @scroll.passive="onScroll">
      <p v-if="loading" class="bookmark-message" role="status">Loading bookmarks…</p>
      <p v-else-if="error" class="bookmark-message" role="status">{{ error }} <button class="text-action" type="button" @click="emit('retry')">Retry</button></p>
      <template v-else>
        <p v-if="!entries.length" class="bookmark-message" role="status">{{ emptyMessage }}</p>
        <p v-else-if="!searching && currentId === null && !moreView && !catalog.searchIndex.length" class="bookmark-message" role="status">No bookmarks yet</p>
        <div id="bookmark-results" class="bookmark-entries" :class="`bookmark-entries--${view}`" :role="searching ? 'listbox' : undefined" :aria-label="searching ? 'Matching bookmarks' : undefined">
          <BookmarkItem
            v-for="(node, index) in visibleEntries"
            :id="resultId(node.id)"
            :key="node.id"
            :node="node"
            :folder-path="searching ? searchPaths.get(node.id) : moreView ? catalog.paths.get(node.id) || 'All Bookmarks' : undefined"
            :selected="searching ? activeIndex === index : undefined"
            @open="openEntry"
          />
        </div>
        <button v-if="entries.length > limit" class="text-action bookmark-load-more" type="button" @click="loadMore">Show more · {{ (entries.length - limit).toLocaleString() }} remaining</button>
      </template>
    </div>
  </section>
</template>
