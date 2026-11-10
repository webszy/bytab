import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { browser, type Browser } from 'wxt/browser';
import { websiteLabel, websiteUrl } from '../utils/urls';

export function useLastClosed() {
  const session = shallowRef<Browser.sessions.Session | null>(null);
  const loading = ref(true);
  const restoring = ref(false);
  const error = ref('');
  let revision = 0;
  let disposed = false;

  const title = computed(() => session.value?.tab?.title?.trim() || 'Restore last tab');
  const hostname = computed(() => {
    const url = session.value?.tab?.url;
    return url && websiteUrl(url) ? websiteLabel(url) : 'Recently closed';
  });

  async function refresh() {
    const request = ++revision;
    try {
      const recentlyClosed = await browser.sessions.getRecentlyClosed({ maxResults: 10 });
      if (disposed || request !== revision) return;
      session.value = recentlyClosed.find(item => item.tab?.sessionId && !item.window) ?? null;
      error.value = '';
    } catch {
      if (!disposed && request === revision) error.value = 'Could not load recently closed tabs. Try again.';
    } finally {
      if (!disposed && request === revision) loading.value = false;
    }
  }

  async function restore() {
    const sessionId = session.value?.tab?.sessionId;
    if (!sessionId || restoring.value) return;
    restoring.value = true;
    error.value = '';
    try {
      // A shared lock also protects against restoring the same session in two New Tabs.
      await navigator.locks.request(`bytab:restore:${sessionId}`, async () => {
        const current = await browser.sessions.getRecentlyClosed({ maxResults: 10 });
        if (!current.some(item => item.tab?.sessionId === sessionId && !item.window)) {
          throw new Error('This tab has already been restored.');
        }
        await browser.sessions.restore(sessionId);
      });
      await refresh();
    } catch {
      await refresh();
      if (!disposed) error.value = 'Could not restore this tab. It may already have been restored.';
    } finally {
      if (!disposed) restoring.value = false;
    }
  }

  onMounted(() => {
    browser.sessions.onChanged.addListener(refresh);
    void refresh();
  });
  onBeforeUnmount(() => {
    disposed = true;
    revision++;
    browser.sessions.onChanged.removeListener(refresh);
  });

  return { session, title, hostname, loading, restoring, error, refresh, restore };
}
