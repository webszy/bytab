<script setup lang="ts">
import brandLogo from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-charcoal-minimal.svg?url';
import HomeIcon from './HomeIcon.vue';

defineProps<{ bookmarkCount: number | null; bookmarksUnavailable: boolean }>();
defineEmits<{ settings: [] }>();
</script>

<template>
  <header class="home-topbar">
    <div class="home-brand-lockup">
      <h1 class="home-brand-heading">
        <img class="home-brand-logo" :src="brandLogo" alt="bytab" />
      </h1>
      <span class="home-brand-divider" aria-hidden="true" />
      <p class="home-bookmark-count">
        <template v-if="bookmarksUnavailable">Bookmarks unavailable</template>
        <template v-else-if="bookmarkCount === null">—</template>
        <template v-else>{{ bookmarkCount.toLocaleString() }} {{ bookmarkCount === 1 ? 'Bookmark' : 'Bookmarks' }}</template>
      </p>
    </div>

    <button
      class="home-appearance"
      type="button"
      aria-label="Settings"
      title="Background settings"
      @click="$emit('settings')"
    >
      <HomeIcon name="settings" />
      <span>Settings</span>
    </button>
  </header>
</template>
