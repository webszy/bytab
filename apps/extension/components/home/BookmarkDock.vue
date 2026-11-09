<script setup lang="ts">
import HomeIcon from './HomeIcon.vue';

defineProps<{ bookmarkCount: number | null }>();

// Stitch demonstration items, independent of real Chrome bookmark folders.
const demoFolders = [
  { label: 'Development', icon: 'code', color: 'development' },
  { label: 'Design', icon: 'camera', color: 'design' },
  { label: 'AI Tools', icon: 'star', color: 'ai' },
  { label: 'Work', icon: 'briefcase', color: 'work' },
  { label: 'Reading', icon: 'book', color: 'reading' },
  { label: 'More (3)', icon: 'more', color: 'more' },
] as const;
</script>

<template>
  <footer class="bookmark-dock" aria-label="Bookmark dock preview">
    <div class="dock-surface" aria-hidden="true" />
    <div class="dock-content">
      <div class="dock-root-group">
        <button class="dock-root dock-item" type="button" disabled title="Dock preview. Folder navigation is not connected yet.">
          <span class="dock-root-icon"><HomeIcon name="bookmark" /></span>
          <span class="dock-root-copy">
            <span class="dock-root-title">All Bookmarks <span class="dock-count">{{ bookmarkCount === null ? '—' : bookmarkCount.toLocaleString('en-US') }}</span></span>
            <span class="dock-root-subtitle">Demo folders</span>
          </span>
        </button>
        <span class="dock-divider" aria-hidden="true" />
      </div>

      <nav class="dock-navigation" aria-label="Demo bookmark folders" tabindex="0">
        <button
          v-for="folder in demoFolders"
          :key="folder.label"
          class="dock-folder dock-item"
          :class="`dock-folder--${folder.color}`"
          type="button"
          disabled
          :title="`${folder.label}: demonstration only. Folder navigation is not connected yet.`"
        >
          <span class="dock-folder-icon"><HomeIcon :name="folder.icon" /></span>
          <span>{{ folder.label }}</span>
        </button>
      </nav>

      <div class="dock-tools">
        <button class="dock-filter" type="button" disabled title="Bookmark filtering is not available yet"><HomeIcon name="search" /><span>Filter</span></button>
        <div class="dock-view-switch" role="group" aria-label="View controls preview">
          <button class="is-selected" type="button" disabled aria-pressed="true" title="Grid view preview"><HomeIcon name="grid" /><span class="sr-only">Grid view</span></button>
          <button type="button" disabled aria-pressed="false" title="List view is not available yet"><HomeIcon name="list" /><span class="sr-only">List view</span></button>
        </div>
      </div>
    </div>
  </footer>
</template>
