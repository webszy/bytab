import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { browser, type Browser } from 'wxt/browser';

export type BookmarkNode = Browser.bookmarks.BookmarkTreeNode;

export function useBookmarks() {
  const tree = shallowRef<BookmarkNode[]>([]);
  const loading = ref(true);
  const error = ref('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let revision = 0;
  let disposed = false;

  const nodes = computed(() => {
    const byId = new Map<string, BookmarkNode>();
    const remaining = [...tree.value];
    while (remaining.length) {
      const node = remaining.pop()!;
      byId.set(node.id, node);
      if (node.children) {
        for (let index = node.children.length - 1; index >= 0; index--) remaining.push(node.children[index]!);
      }
    }
    return byId;
  });
  const bookmarkCount = computed(() =>
    loading.value || error.value ? null : [...nodes.value.values()].filter(node => !!node.url).length);
  // The synthetic tree root is structural. All real root folders remain accessible.
  const roots = computed(() => tree.value.flatMap(node =>
    !node.url && node.parentId === undefined ? node.children ?? [] : [node]));
  const folders = computed(() => [...nodes.value.values()]
    .filter(node => !node.url && node.parentId !== undefined));

  async function refresh() {
    const request = ++revision;
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

  return { tree, nodes, roots, folders, bookmarkCount, loading, error, refresh };
}
