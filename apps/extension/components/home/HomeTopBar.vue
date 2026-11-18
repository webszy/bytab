<script setup lang="ts">
import brandLogo from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-charcoal-minimal.svg?url';
import HomeIcon from './HomeIcon.vue';

defineProps<{ bookmarksUnavailable: boolean }>();
defineEmits<{ settings: [] }>();
</script>

<template>
  <header class="home-topbar">
    <div class="home-brand-lockup">
      <h1 class="home-brand-heading">
        <img class="home-brand-logo" :src="brandLogo" alt="bytab" />
      </h1>
      <span class="home-brand-divider" aria-hidden="true" />
      <p class="home-brand-tagline">Start your day.<br />Start with bytab.</p>
      <template v-if="bookmarksUnavailable">
        <span class="home-brand-divider" aria-hidden="true" />
        <p class="home-bookmark-status">Bookmarks unavailable</p>
      </template>
    </div>

    <button
      class="home-appearance"
      type="button"
      aria-label="Settings"
      title="Appearance"
      @click="$emit('settings')"
    >
      <HomeIcon name="settings" />
      <span>Settings</span>
    </button>
  </header>
</template>
