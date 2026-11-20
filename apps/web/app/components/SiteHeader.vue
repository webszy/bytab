<script setup lang="ts">
import HomeIcon from '#extension-home/HomeIcon.vue';
import brandLogo from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-charcoal-minimal.svg?url';
import nightBrandLogo from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-white-minimal.svg?url';

defineEmits<{ settings: [] }>();
</script>

<template>
  <header class="home-topbar">
    <NuxtLink to="/" class="home-brand-lockup">
      <span class="home-brand-heading">
        <img class="home-brand-logo" :src="brandLogo" alt="bytab" />
        <img class="home-brand-logo home-brand-logo--night" :src="nightBrandLogo" alt="bytab" />
      </span>
    </NuxtLink>
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
