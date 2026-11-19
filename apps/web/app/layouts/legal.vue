<script setup lang="ts">
import { legalDocuments, supportPage } from '#shared/site';
import brandLogo from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-charcoal-minimal.svg?url';
import brandLogoLight from '../../../shared/ByTab_Brand_Kit_v1.0/02_Logo_Lockups/horizontal-white-minimal.svg?url';

const route = useRoute();
const navigation = [...legalDocuments, supportPage];
</script>

<template>
  <div class="legal-document">
    <header class="legal-bar">
      <NuxtLink class="legal-brand" to="/" aria-label="bytab, back to the homepage">
        <img class="legal-logo legal-logo--ink" :src="brandLogo" alt="" />
        <img class="legal-logo legal-logo--light" :src="brandLogoLight" alt="" />
      </NuxtLink>
      <nav class="legal-nav" aria-label="Site">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :aria-current="route.path === item.path ? 'page' : undefined"
        >
          {{ item.title }}
        </NuxtLink>
      </nav>
    </header>
    <main class="legal-main">
      <slot />
    </main>
    <footer class="legal-end">
      <nav aria-label="Footer">
        <NuxtLink to="/">Back to bytab</NuxtLink>
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :aria-current="route.path === item.path ? 'page' : undefined"
        >
          {{ item.title }}
        </NuxtLink>
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.legal-document {
  position: fixed;
  z-index: 1;
  inset: 0;
  overflow: auto;
  background: #f4f5f7;
  color: #1d1d1f;
  color-scheme: light;
}

.legal-bar,
.legal-end {
  display: flex;
  width: min(760px, calc(100% - 40px));
  margin-inline: auto;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.legal-bar {
  padding-top: max(28px, env(safe-area-inset-top, 0px));
}

.legal-brand {
  display: block;
  flex: none;
  line-height: 0;
}

.legal-logo {
  display: block;
  width: auto;
  height: 32px;
}

.legal-logo--light { display: none; }

.legal-nav,
.legal-end nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.legal-nav a,
.legal-end a {
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.legal-nav a:hover,
.legal-end a:hover { color: #0071e3; }

.legal-nav a[aria-current='page'],
.legal-end a[aria-current='page'] { color: #0071e3; }

.legal-nav a:focus-visible,
.legal-end a:focus-visible,
.legal-brand:focus-visible {
  outline: 2px solid #0071e3;
  outline-offset: 3px;
  border-radius: 6px;
}

.legal-main {
  width: min(760px, calc(100% - 40px));
  margin: 36px auto 12px;
  padding: 40px 44px 20px;
  border: 1px solid rgb(255 255 255 / 80%);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 24px 80px -28px rgb(0 0 0 / 18%);
}

.legal-end {
  padding: 8px 0 max(36px, env(safe-area-inset-bottom, 0px));
}

@media (max-width: 640px) {
  .legal-bar,
  .legal-end,
  .legal-main { width: min(760px, calc(100% - 24px)); }
  .legal-bar { align-items: flex-start; flex-direction: column; gap: 14px; }
  .legal-main { margin-top: 22px; padding: 28px 20px 12px; border-radius: 14px; }
}

@media (prefers-color-scheme: dark) {
  .legal-document {
    background: #161618;
    color: #f5f5f7;
    color-scheme: dark;
  }
  .legal-logo--ink { display: none; }
  .legal-logo--light { display: block; }
  .legal-main {
    border-color: rgb(255 255 255 / 12%);
    background: #232326;
    box-shadow: 0 24px 80px -28px rgb(0 0 0 / 55%);
  }
  .legal-nav a:hover,
  .legal-end a:hover,
  .legal-nav a[aria-current='page'],
  .legal-end a[aria-current='page'] { color: #8fc4ff; }
}
</style>
