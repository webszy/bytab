<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { browser, type Browser } from 'wxt/browser';
import BookmarkDock from '@/components/home/BookmarkDock.vue';
import HomeBrand from '@/components/home/HomeBrand.vue';
import HomeTopBar from '@/components/home/HomeTopBar.vue';
import PromptBar from '@/components/home/PromptBar.vue';
import ShortcutsPanel from '@/components/home/ShortcutsPanel.vue';
import '@/assets/styles/home.css';

const bookmarkCount = ref<number | null>(null);
const bookmarksUnavailable = ref(false);

function countBookmarks(tree: Browser.bookmarks.BookmarkTreeNode[]) {
  let count = 0;
  const remaining = [...tree];
  while (remaining.length > 0) {
    const node = remaining.pop()!;
    if (node.url) count++;
    for (const child of node.children ?? []) remaining.push(child);
  }
  return count;
}

onMounted(async () => {
  try {
    bookmarkCount.value = countBookmarks(await browser.bookmarks.getTree());
  } catch {
    bookmarksUnavailable.value = true;
    console.warn('Bookmarks API is unavailable.');
  }
});
</script>

<template>
  <div class="home-page">
    <div class="home-background" aria-hidden="true" />
    <HomeTopBar :bookmark-count="bookmarkCount" :bookmarks-unavailable="bookmarksUnavailable" />
    <main class="home-main">
      <HomeBrand />
      <PromptBar />
      <ShortcutsPanel />
    </main>
    <div class="home-bottom-buffer" aria-hidden="true" />
    <BookmarkDock :bookmark-count="bookmarkCount" />
  </div>
</template>
