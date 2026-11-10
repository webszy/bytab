<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ time?: string; date?: string }>();
const time = ref('09:41');
const dateLabel = ref('Tuesday, November 10');
let clockInterval: ReturnType<typeof setInterval> | undefined;

function updateClock() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = parts.find(part => part.type === 'hour')?.value ?? '09';
  const minute = parts.find(part => part.type === 'minute')?.value ?? '41';
  time.value = `${hour}:${minute}`;
  dateLabel.value = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
}

onMounted(() => {
  if (props.time !== undefined && props.date !== undefined) return;
  updateClock();
  clockInterval = setInterval(updateClock, 30_000);
});
onBeforeUnmount(() => clearInterval(clockInterval));
</script>

<template>
  <div class="home-datetime">
    <time class="home-time" :aria-label="`Current local time, ${props.time ?? time}`">{{ props.time ?? time }}</time>
    <p class="home-date">{{ props.date ?? dateLabel }}</p>
  </div>
</template>
