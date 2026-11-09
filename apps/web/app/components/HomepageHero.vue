<script setup lang="ts">
import PromptBar from '#extension-home/PromptBar.vue';
import { siteFeatures } from '#shared/site';

const config = useRuntimeConfig();
const privacy = siteFeatures.find(feature => feature.id === 'privacy')!;
</script>

<template>
  <div class="homepage-hero">
    <div class="home-brand" aria-label="bytab">
      <span class="home-brand-mark"><SiteIcon name="brand" /></span>
      <span class="home-brand-wordmark">bytab</span>
    </div>
    <h1 class="hero-slogan">
      <span>Chrome for browsing.</span>
      <span>bytab for bookmarks.</span>
    </h1>
    <p class="hero-subtitle">Your bookmarks deserve a better home.</p>
    <p class="hero-description">
      A beautiful, privacy-friendly new tab for Chrome. Keep your bookmarks and favorite websites within easy reach.
    </p>

    <PromptBar />

    <a v-if="config.public.chromeWebStoreUrl" class="chrome-cta" :href="config.public.chromeWebStoreUrl" target="_blank" rel="noopener noreferrer">
      <SiteIcon name="plus" />
      Add to Chrome
    </a>
    <button v-else class="chrome-cta" type="button" disabled title="Chrome Web Store link coming soon" aria-describedby="chrome-store-status">
      <SiteIcon name="plus" />
      Add to Chrome
    </button>
    <span v-if="!config.public.chromeWebStoreUrl" id="chrome-store-status" class="sr-only">Chrome Web Store link coming soon.</span>

    <NuxtLink :to="privacy.path" class="privacy-badge glass-pill" :title="privacy.description" aria-describedby="privacy-summary">
      <SiteIcon :name="privacy.icon" />
      <span>Local-first · No bookmark uploads</span>
    </NuxtLink>
    <p id="privacy-summary" class="sr-only">{{ privacy.description }}</p>
  </div>
</template>
