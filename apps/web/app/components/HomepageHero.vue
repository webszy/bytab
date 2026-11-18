<script setup lang="ts">
import { useClock } from '#extension-composables/useClock';
import HomeClock from '#extension-home/HomeClock.vue';
import HolidayInfo from '#extension-home/HolidayInfo.vue';
import PromptBar from '#extension-home/PromptBar.vue';
import RecentPagesRow from '#extension-home/RecentPagesRow.vue';
import ShortcutsPanel from '#extension-home/ShortcutsPanel.vue';
import type { IntroId } from '#shared/intros';

defineEmits<{ openIntro: [id: IntroId] }>();
const { time, date, holiday } = useClock();
</script>

<template>
  <HomeClock :time="time" :date="date" />
  <HolidayInfo :label="holiday" confirmed />
  <RecentPagesRow empty-hint="Available in the Chrome extension" />
  <div class="intro-hotspot intro-hotspot--prompt">
    <div class="intro-hotspot-preview" inert>
      <PromptBar />
    </div>
    <button
      id="intro-prompt"
      class="intro-hotspot-hit"
      type="button"
      aria-haspopup="dialog"
      aria-controls="intro-window"
      aria-label="Start Here"
      @click="$emit('openIntro', 'prompt')"
    />
  </div>
  <div class="intro-hotspot intro-hotspot--shortcuts">
    <div class="intro-hotspot-preview" inert>
      <ShortcutsPanel />
    </div>
    <button
      id="intro-shortcuts"
      class="intro-hotspot-hit"
      type="button"
      aria-haspopup="dialog"
      aria-controls="intro-window"
      aria-label="Your Favorites"
      @click="$emit('openIntro', 'shortcuts')"
    />
  </div>
</template>
