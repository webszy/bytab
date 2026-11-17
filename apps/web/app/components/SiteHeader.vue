<script setup lang="ts">
import brandLogo from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-charcoal-minimal.svg?url';
import { siteFeatures } from '#shared/site';

const appearance = siteFeatures.find(feature => feature.id === 'appearance')!;
</script>

<template>
  <header class="home-topbar">
    <NuxtLink to="/" class="home-brand-lockup">
      <h1 class="home-brand-heading">
        <img class="home-brand-logo" :src="brandLogo" alt="bytab" />
      </h1>
    </NuxtLink>
    <NuxtLink :to="appearance.path" class="home-appearance" aria-label="Settings" :title="appearance.title">
      <SiteIcon name="settings" />
      <span>Settings</span>
    </NuxtLink>
  </header>
</template>
