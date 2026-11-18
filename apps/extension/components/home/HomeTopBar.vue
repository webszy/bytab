<script setup lang="ts">
import type { Component } from 'vue';
import brandLogo from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-charcoal-minimal.svg?url';
import HomeIcon from './HomeIcon.vue';

defineProps<{ bookmarksUnavailable?: boolean; linkComponent?: Component }>();
defineEmits<{ settings: [] }>();
</script>

<template>
  <header class="home-topbar">
    <component :is="linkComponent ?? 'div'" class="home-brand-lockup" :to="linkComponent ? '/' : undefined">
      <h1 class="home-brand-heading">
        <img class="home-brand-logo" :src="brandLogo" alt="bytab" />
      </h1>
      <span class="home-brand-divider" aria-hidden="true" />
      <p class="home-brand-tagline">Start your day.<br />Start with bytab.</p>
      <template v-if="bookmarksUnavailable">
        <span class="home-brand-divider" aria-hidden="true" />
        <p class="home-bookmark-status">Bookmarks unavailable</p>
      </template>
    </component>

    <button
      id="home-settings"
      class="home-appearance"
      type="button"
      aria-label="Settings"
      aria-haspopup="dialog"
      title="Appearance"
      @click="$emit('settings')"
    >
      <HomeIcon name="settings" />
      <span>Settings</span>
    </button>
  </header>
</template>
