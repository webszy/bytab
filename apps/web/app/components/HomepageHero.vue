<script setup lang="ts">
import HomeClock from '#extension-home/HomeClock.vue';
import HolidayInfo from '#extension-home/HolidayInfo.vue';
import PromptBar from '#extension-home/PromptBar.vue';
import ShortcutsPanel from '#extension-home/ShortcutsPanel.vue';
</script>

<template>
  <div class="homepage-hero">
    <HomeClock />
    <HolidayInfo label="Upcoming holiday" />
    <PromptBar />
    <ShortcutsPanel />
  </div>
</template>
