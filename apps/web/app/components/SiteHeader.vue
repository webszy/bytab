<script setup lang="ts">
import { siteFeatures } from '#shared/site';

const appearance = siteFeatures.find(feature => feature.id === 'appearance')!;
const time = ref('--:--');
let clockInterval: ReturnType<typeof setInterval> | undefined;

function updateClock() {
  time.value = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date());
}

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 30_000);
});
onBeforeUnmount(() => clearInterval(clockInterval));
</script>

<template>
  <header class="home-topbar">
    <NuxtLink to="/" class="home-bookmark-status glass-pill" aria-label="bytab home">
      <SiteIcon name="bookmark" />
      <span>bytab</span>
    </NuxtLink>
    <div class="home-utilities">
      <time class="home-clock glass-pill" aria-label="Current local time">{{ time }}</time>
      <NuxtLink :to="appearance.path" class="home-appearance" :title="appearance.title">
        <span class="wallpaper-preview" aria-hidden="true" />
        <span>{{ appearance.label }}</span>
        <SiteIcon :name="appearance.icon" />
      </NuxtLink>
    </div>
  </header>
</template>
