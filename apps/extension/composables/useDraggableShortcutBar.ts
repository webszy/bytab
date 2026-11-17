import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import type { ShortcutBarLayout } from '../utils/shortcutCollections';
import { dockSafeBounds } from '../utils/dockBounds';
import type { ShortcutPosition } from '../utils/shortcuts';

export function useDraggableShortcutBar(
  panel: Ref<HTMLElement | null>, anchor: Ref<HTMLElement | null>,
  state: () => ShortcutBarLayout, disabled: () => boolean,
  save: (layout: ShortcutBarLayout) => void,
) {
  const viewport = ref({ width: 0, height: 0 });
  const height = ref(160);
  const draft = ref<ShortcutPosition>();
  const dragging = ref(false);
  let layoutObserver: MutationObserver | undefined;
  let observer: ResizeObserver | undefined;
  let drag: { id: number; startX: number; startY: number; offsetX: number; offsetY: number } | undefined;
  const bounds = computed(() => dockSafeBounds(viewport.value.width, viewport.value.height));
  const width = computed(() => Math.min(680, Math.max(0, bounds.value.right - bounds.value.left - 48)));
  const detached = computed(() => !!(draft.value || state().position));

  function measure() {
    viewport.value = { width: window.innerWidth, height: window.innerHeight };
    height.value = panel.value?.offsetHeight ?? 160;
  }
  function fit(left: number, top: number) {
    const area = bounds.value;
    const minY = area.top + 12;
    const maxY = Math.max(minY, area.bottom - height.value - 12);
    const clamp = (x: number, y: number) => ({
      left: Math.max(area.left + 16, Math.min(area.right - width.value - 16, x)),
      top: Math.max(minY, Math.min(maxY, y)),
    });
    const wanted = clamp(left, top);
    const obstacles = [...document.querySelectorAll<HTMLElement>('.home-prompt, .home-recent, .home-datetime')]
      .map(element => element.getBoundingClientRect());
    const fits = (point: { left: number; top: number }) => obstacles.every(rect =>
      point.left + width.value + 8 <= rect.left || point.left >= rect.right + 8
      || point.top + height.value + 8 <= rect.top || point.top >= rect.bottom + 8);
    if (fits(wanted)) return wanted;
    const candidates = obstacles.flatMap(rect => [clamp(wanted.left, rect.bottom + 8),
      clamp(wanted.left, rect.top - height.value - 8), clamp(rect.left - width.value - 8, wanted.top), clamp(rect.right + 8, wanted.top)]);
    return candidates.filter(fits).sort((a, b) => Math.hypot(a.left - wanted.left, a.top - wanted.top)
      - Math.hypot(b.left - wanted.left, b.top - wanted.top))[0] ?? wanted;
  }
  function normalize(left: number, top: number): ShortcutPosition {
    return { x: left / Math.max(1, viewport.value.width - width.value), y: top / Math.max(1, viewport.value.height - height.value) };
  }
  const style = computed(() => {
    const position = draft.value || state().position;
    if (!position || !viewport.value.width) return undefined;
    const point = fit(position.x * (viewport.value.width - width.value), position.y * (viewport.value.height - height.value));
    return { position: 'fixed' as const, left: `${point.left}px`, top: `${point.top}px`, width: `${width.value}px`, zIndex: 26 };
  });
  const anchorStyle = computed(() => detached.value ? { height: `${height.value}px` } : undefined);

  function start(event: PointerEvent) {
    if (state().pinned || disabled() || event.button !== 0 || !event.isPrimary || !panel.value) return;
    measure();
    const rect = panel.value.getBoundingClientRect();
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
  }
  function move(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId) return;
    if (state().pinned || disabled()) { cancel(); return; }
    if (!dragging.value && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    event.preventDefault();
    dragging.value = true;
    const point = fit(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
    draft.value = normalize(point.left, point.top);
  }
  function clear() {
    drag = undefined;
    dragging.value = false;
    draft.value = undefined;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('blur', cancel);
  }
  function end(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId) return;
    if (dragging.value && draft.value) save({ pinned: false, position: draft.value });
    clear();
  }
  function cancel() { clear(); }
  function keydown(event: KeyboardEvent) {
    if (state().pinned || disabled() || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || !panel.value) return;
    event.preventDefault();
    const rect = panel.value.getBoundingClientRect(), step = event.shiftKey ? 40 : 10;
    const point = fit(rect.left + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
      rect.top + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0));
    save({ pinned: false, position: normalize(point.left, point.top) });
  }
  watch(() => state().pinned, pinned => { if (pinned) cancel(); });
  onMounted(() => {
    measure();
    window.addEventListener('resize', measure);
    observer = new ResizeObserver(measure);
    if (panel.value) observer.observe(panel.value);
    if (anchor.value) observer.observe(anchor.value);
    const page = panel.value?.closest('.home-page');
    if (page) {
      layoutObserver = new MutationObserver(() => { cancel(); measure(); });
      layoutObserver.observe(page, { attributes: true, attributeFilter: ['data-dock-position'] });
    }
  });
  onBeforeUnmount(() => { clear(); observer?.disconnect(); layoutObserver?.disconnect(); window.removeEventListener('resize', measure); });
  return { style, anchorStyle, dragging, start, keydown };
}
