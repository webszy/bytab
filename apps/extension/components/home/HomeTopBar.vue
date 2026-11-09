<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import HomeIcon from './HomeIcon.vue';

defineProps<{ bookmarkCount: number | null; bookmarksUnavailable: boolean }>();

const time = ref('');
let clockInterval: ReturnType<typeof setInterval> | undefined;

function updateClock() {
  time.value = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

updateClock();
onMounted(() => { clockInterval = setInterval(updateClock, 30_000); });
onBeforeUnmount(() => { clearInterval(clockInterval); });
</script>

<template>
  <header class="home-topbar">
    <div class="home-bookmark-status glass-pill" role="status">
      <HomeIcon name="bookmark" />
      <span v-if="bookmarksUnavailable">Bookmarks unavailable</span>
      <span v-else>{{ bookmarkCount === null ? '—' : bookmarkCount.toLocaleString('en-US') }} {{ bookmarkCount === 1 ? 'Bookmark' : 'Bookmarks' }}</span>
    </div>

    <div class="home-utilities">
      <time class="home-clock glass-pill" aria-label="Current local time">{{ time }}</time>
      <button
        class="home-appearance"
        type="button"
        disabled
        title="Appearance settings are not available yet"
      >
        <span class="wallpaper-preview" role="img" aria-label="Current wallpaper" />
        <span>Appearance</span>
        <HomeIcon name="settings" />
      </button>
    </div>
  </header>
</template>
