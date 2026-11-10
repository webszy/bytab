import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue';

export function useClock() {
  const now = shallowRef(new Date());
  const locale = navigator.language;
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const time = computed(() => timeFormatter.format(now.value));
  const date = computed(() => dateFormatter.format(now.value));
  let timer: ReturnType<typeof setTimeout> | undefined;

  function refresh() {
    clearTimeout(timer);
    now.value = new Date();
    if (!document.hidden) {
      timer = setTimeout(refresh, 60_000 - (Date.now() % 60_000) + 20);
    }
  }

  onMounted(() => {
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

  return { now, time, date, locale };
}
