<script setup lang="ts">
defineProps<{ time: string; date: string }>();
</script>

<template>
  <div class="home-datetime">
    <time class="home-time" :aria-label="time ? `Current local time, ${time}` : 'Local time'">{{ time || '––:––' }}</time>
    <p class="home-date">{{ date || '\u00a0' }}</p>
  </div>
</template>
