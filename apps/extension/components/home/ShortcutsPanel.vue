<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { defaultShortcuts, type Shortcut, type ShortcutPosition } from '../../utils/shortcuts';
import HomeIcon from './HomeIcon.vue';
import ShortcutTile from './ShortcutTile.vue';

const props = defineProps<{
  shortcuts?: Shortcut[];
  enabled?: boolean;
  loading?: boolean;
  busy?: boolean;
  layoutTarget?: string;
}>();
const emit = defineEmits<{
  open: [shortcut: Shortcut];
  add: [];
  edit: [shortcut: Shortcut];
  move: [id: string, position?: ShortcutPosition, beforeId?: string | null];
  resetLayout: [];
}>();
const items = computed(() => props.loading ? [] : props.shortcuts ?? defaultShortcuts);
const grid = ref<HTMLElement | null>(null);
const viewport = ref({ width: 0, height: 0, revision: 0 });
const draggedId = ref<string | null>(null);
const dragPosition = ref<ShortcutPosition | null>(null);
const tileWidth = 64;
const tileHeight = 84;
let observer: ResizeObserver | undefined;
let layoutObserver: MutationObserver | undefined;
let suppressedId = '';
let suppressedUntil = 0;
let drag: {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
} | null = null;

function updateViewport() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight, revision: viewport.value.revision + 1 };
}

function fitPosition(x: number, y: number, id: string) {
  const { width, height } = viewport.value;
  const topbar = document.querySelector('.home-topbar')?.getBoundingClientRect();
  const dock = document.querySelector('.bookmark-dock')?.getBoundingClientRect();
  const minX = 16;
  const maxX = Math.max(minX, width - tileWidth - 16);
  const minY = (topbar?.bottom ?? 56) + 16;
  const maxY = Math.max(minY, (dock?.top ?? height - 80) - tileHeight - 16);
  const clamp = (left: number, top: number) => ({
    left: Math.max(minX, Math.min(maxX, left)),
    top: Math.max(minY, Math.min(maxY, top)),
  });
  const wanted = clamp(x, y);
  const obstacles = [
    ...document.querySelectorAll<HTMLElement>('.home-prompt, .home-recent, .home-datetime, .home-holiday, .home-shortcuts'),
    ...document.querySelectorAll<HTMLElement>('.shortcut-positioned'),
  ].filter(element => element.dataset.shortcutId !== id)
    .map(element => element.getBoundingClientRect())
    .filter(rect => rect.width > 0 && rect.height > 0);
  const valid = (candidate: { left: number; top: number }) => obstacles.every(rect =>
    candidate.left + tileWidth + 8 <= rect.left || candidate.left >= rect.right + 8
    || candidate.top + tileHeight + 8 <= rect.top || candidate.top >= rect.bottom + 8);
  if (valid(wanted)) return wanted;
  const candidates = obstacles.flatMap(rect => [
    clamp(rect.left - tileWidth - 8, wanted.top),
    clamp(rect.right + 8, wanted.top),
    clamp(wanted.left, rect.top - tileHeight - 8),
    clamp(wanted.left, rect.bottom + 8),
  ]);
  for (let left = minX; left <= maxX; left += tileWidth + 16) {
    for (let top = minY; top <= maxY; top += tileHeight + 12) candidates.push({ left, top });
  }
  return candidates.filter(valid).sort((left, right) =>
    Math.hypot(left.left - wanted.left, left.top - wanted.top)
    - Math.hypot(right.left - wanted.left, right.top - wanted.top))[0] ?? wanted;
}

function normalize(left: number, top: number): ShortcutPosition {
  return {
    x: left / Math.max(1, viewport.value.width - tileWidth),
    y: top / Math.max(1, viewport.value.height - tileHeight),
  };
}

function positionFor(shortcut: Shortcut) {
  return draggedId.value === shortcut.id ? dragPosition.value : shortcut.position;
}

function positionStyle(shortcut: Shortcut) {
  const position = positionFor(shortcut);
  if (!props.enabled || !position || !viewport.value.width) return undefined;
  const fitted = fitPosition(
    position.x * (viewport.value.width - tileWidth),
    position.y * (viewport.value.height - tileHeight),
    shortcut.id,
  );
  return { left: `${fitted.left}px`, top: `${fitted.top}px` };
}

function startDrag(shortcut: Shortcut, event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary || drag) return;
  const element = (event.currentTarget as HTMLElement).closest<HTMLElement>('.shortcut-entry');
  if (!element) return;
  const rect = element.getBoundingClientRect();
  drag = {
    id: shortcut.id, pointerId: event.pointerId,
    startX: event.clientX, startY: event.clientY,
    offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
  };
  window.addEventListener('pointermove', onDrag, { passive: false });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', cancelDrag);
  window.addEventListener('blur', cancelDrag);
}

function onDrag(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!draggedId.value && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
  event.preventDefault();
  draggedId.value = drag.id;
  const fitted = fitPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY, drag.id);
  dragPosition.value = normalize(fitted.left, fitted.top);
}

function clearDrag() {
  drag = null;
  draggedId.value = null;
  dragPosition.value = null;
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointercancel', cancelDrag);
  window.removeEventListener('blur', cancelDrag);
}

function suppressDragClick() {
  suppressedId = draggedId.value ?? '';
  suppressedUntil = performance.now() + 500;
}

function endDrag(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (draggedId.value && dragPosition.value) {
    event.preventDefault();
    suppressDragClick();
    const rect = grid.value?.getBoundingClientRect();
    const inGrid = rect && event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top - 12 && event.clientY <= rect.bottom + 12;
    if (inGrid) {
      const before = [...grid.value!.querySelectorAll<HTMLElement>('[data-grid-id]')]
        .find(element => element.dataset.gridId !== drag!.id
          && event.clientX < element.getBoundingClientRect().left + element.offsetWidth / 2);
      emit('move', drag.id, undefined, before?.dataset.gridId ?? null);
    } else {
      emit('move', drag.id, dragPosition.value);
    }
  }
  clearDrag();
}

function cancelDrag() {
  suppressDragClick();
  clearDrag();
}

function open(shortcut: Shortcut) {
  if (shortcut.id === suppressedId && performance.now() < suppressedUntil) return;
  emit('open', shortcut);
}

onMounted(() => {
  if (!props.enabled) return;
  updateViewport();
  window.addEventListener('resize', updateViewport);
  observer = new ResizeObserver(updateViewport);
  const main = document.querySelector('.home-main');
  if (main) {
    observer.observe(main);
    layoutObserver = new MutationObserver(updateViewport);
    layoutObserver.observe(main, { childList: true });
    const prompt = main.querySelector('.home-prompt');
    if (prompt) layoutObserver.observe(prompt, { attributes: true, attributeFilter: ['class'] });
  }
  if (grid.value) observer.observe(grid.value);
});
onBeforeUnmount(() => {
  clearDrag();
  observer?.disconnect();
  layoutObserver?.disconnect();
  window.removeEventListener('resize', updateViewport);
});
</script>

<template>
  <section class="home-shortcuts" aria-labelledby="home-shortcuts-heading">
    <header class="shortcuts-header">
      <h2 id="home-shortcuts-heading"><HomeIcon name="dots" />Frequent Shortcuts</h2>
      <button v-if="enabled" class="shortcuts-alignment" type="button" title="Restore aligned positions and default order" :disabled="busy || loading" @click="emit('resetLayout')"><span aria-hidden="true" />Reset layout</button>
      <span v-else class="shortcuts-alignment"><span aria-hidden="true" />Grid Aligned</span>
    </header>

    <nav ref="grid" class="shortcut-items" aria-label="Frequent shortcuts" :aria-busy="loading">
      <div
        v-for="shortcut in items"
        :key="shortcut.id"
        class="shortcut-slot"
        :class="{ 'shortcut-slot--detached': enabled && shortcut.position }"
        :data-grid-id="enabled && shortcut.position ? undefined : shortcut.id"
      >
        <Teleport :to="layoutTarget || 'body'" :disabled="!enabled || !positionFor(shortcut)">
          <ShortcutTile
            :shortcut="shortcut"
            :enabled="enabled"
            :busy="busy"
            :class="{ 'shortcut-positioned': enabled && positionFor(shortcut), 'is-dragging': draggedId === shortcut.id }"
            :style="positionStyle(shortcut)"
            @open="open"
            @edit="emit('edit', $event)"
            @drag="startDrag"
          />
        </Teleport>
      </div>
      <button class="shortcut-item shortcut-item--add" type="button" :disabled="!enabled || busy || loading" :title="enabled ? 'Add shortcut' : 'Adding shortcuts is not available yet'" @click="emit('add')">
        <span class="shortcut-tile"><HomeIcon name="plus" /></span>
        <span class="shortcut-label">Add</span>
      </button>
    </nav>
  </section>
</template>
