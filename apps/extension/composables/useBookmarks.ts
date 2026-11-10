import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { browser } from 'wxt/browser';
import { createBookmarkCatalog, type BookmarkNode } from '../utils/bookmarkTree';

export function useBookmarks() {
  const tree = shallowRef<BookmarkNode[]>([]);
  const loading = ref(true);
  const error = ref('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let revision = 0;
  let disposed = false;

  const catalog = computed(() => createBookmarkCatalog(tree.value));
  const bookmarkCount = computed(() =>
    loading.value || error.value ? null : catalog.value.searchIndex.length);

  async function refresh() {
    clearTimeout(timer);
    const request = ++revision;
    // Keep the current browser usable during background synchronization.
    if (error.value || !tree.value.length) loading.value = true;
    try {
      const result = await browser.bookmarks.getTree();
      if (disposed || request !== revision) return;
      tree.value = result;
      error.value = '';
    } catch {
      if (!disposed && request === revision) error.value = 'Could not load bookmarks. Try again.';
    } finally {
      if (!disposed && request === revision) loading.value = false;
    }
  }

  function scheduleRefresh() {
    // Coalesce bookmark imports and bursts of move/change events.
    revision++;
    clearTimeout(timer);
    timer = setTimeout(() => void refresh(), 100);
  }

  onMounted(() => {
    browser.bookmarks.onCreated.addListener(scheduleRefresh);
    browser.bookmarks.onRemoved.addListener(scheduleRefresh);
    browser.bookmarks.onChanged.addListener(scheduleRefresh);
    browser.bookmarks.onMoved.addListener(scheduleRefresh);
    browser.bookmarks.onChildrenReordered.addListener(scheduleRefresh);
    browser.bookmarks.onImportEnded.addListener(scheduleRefresh);
    void refresh();
  });
  onBeforeUnmount(() => {
    disposed = true;
    revision++;
    clearTimeout(timer);
    browser.bookmarks.onCreated.removeListener(scheduleRefresh);
    browser.bookmarks.onRemoved.removeListener(scheduleRefresh);
    browser.bookmarks.onChanged.removeListener(scheduleRefresh);
    browser.bookmarks.onMoved.removeListener(scheduleRefresh);
    browser.bookmarks.onChildrenReordered.removeListener(scheduleRefresh);
    browser.bookmarks.onImportEnded.removeListener(scheduleRefresh);
  });

  return { tree, catalog, bookmarkCount, loading, error, refresh };
}
