import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { holidayLabel } from '../utils/holidays';

export function useClock() {
  const now = shallowRef<Date | null>(null);
  const locale = shallowRef('en-US');
  const timeFormatter = computed(() => new Intl.DateTimeFormat(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }));
  const dateFormatter = computed(() => new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }));
  const time = computed(() => now.value ? timeFormatter.value.format(now.value) : '');
  const date = computed(() => now.value ? dateFormatter.value.format(now.value) : '');
  const holiday = computed(() => now.value ? holidayLabel(now.value, locale.value) : '');
  let timer: ReturnType<typeof setTimeout> | undefined;

  function refresh() {
    clearTimeout(timer);
    now.value = new Date();
    if (!document.hidden) {
      timer = setTimeout(refresh, 60_000 - (Date.now() % 60_000) + 20);
    }
  }

  onMounted(() => {
    locale.value = navigator.language;
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
  });
  onBeforeUnmount(() => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', refresh);
    window.removeEventListener('focus', refresh);
    window.removeEventListener('pageshow', refresh);
  });

  return { time, date, holiday };
}
