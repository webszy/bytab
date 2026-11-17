<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { defaultShortcuts, type ShortcutPosition } from '../../utils/shortcuts';
import { isShortcutFolder, type ShortcutEntry, type ShortcutBarLayout } from '../../utils/shortcutCollections';
import { useDraggableShortcutBar } from '../../composables/useDraggableShortcutBar';
import { dockSafeBounds } from '../../utils/dockBounds';
import HomeIcon from './HomeIcon.vue';
import ShortcutTile from './ShortcutTile.vue';

const props = defineProps<{
  shortcuts?: ShortcutEntry[];
  barLayout?: ShortcutBarLayout;
  barBusy?: boolean;
  enabled?: boolean;
  loading?: boolean;
  busy?: boolean;
  layoutTarget?: string;
}>();
const emit = defineEmits<{
  open: [shortcut: ShortcutEntry];
  add: [folderId: string | null];
  addFolder: [];
  saveBar: [layout: ShortcutBarLayout];
  moveToFolder: [id: string, folderId: string | null];
  edit: [shortcut: ShortcutEntry];
  move: [id: string, position?: ShortcutPosition, beforeId?: string | null];
  resetLayout: [];
}>();
const allItems = computed(() => props.loading ? [] : props.shortcuts ?? defaultShortcuts);
const activeFolderId = ref<string | null>(null);
const activeFolder = computed(() => allItems.value.find(item => item.id === activeFolderId.value && isShortcutFolder(item)));
const items = computed(() => allItems.value.filter(item => activeFolder.value
  ? !isShortcutFolder(item) && item.folderId === activeFolder.value.id
  : isShortcutFolder(item) || !item.folderId));
const barPanel = ref<HTMLElement | null>(null);
const barAnchor = ref<HTMLElement | null>(null);
const bar = useDraggableShortcutBar(barPanel, barAnchor, () => props.barLayout ?? { pinned: false },
  () => !props.enabled || !!props.barBusy || !!props.busy || !!props.loading, layout => emit('saveBar', layout));
const dropFolderId = ref<string | null>(null);
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
  const area = dockSafeBounds(width, height);
  const minX = area.left + 16;
  const maxX = Math.max(minX, area.right - tileWidth - 16);
  const minY = area.top + 16;
  const maxY = Math.max(minY, area.bottom - tileHeight - 16);
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

function positionFor(shortcut: ShortcutEntry) {
  return draggedId.value === shortcut.id ? dragPosition.value : shortcut.position;
}

function positionStyle(shortcut: ShortcutEntry) {
  const position = positionFor(shortcut);
  if (!props.enabled || !position || !viewport.value.width) return undefined;
  const fitted = fitPosition(
    position.x * (viewport.value.width - tileWidth),
    position.y * (viewport.value.height - tileHeight),
    shortcut.id,
  );
  return { left: `${fitted.left}px`, top: `${fitted.top}px` };
}

function startDrag(shortcut: ShortcutEntry, event: PointerEvent) {
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
  const folderTarget = [...(grid.value?.querySelectorAll<HTMLElement>('[data-folder-id]') ?? [])].find(element => {
    const rect = element.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  });
  const dragged = allItems.value.find(item => item.id === drag!.id);
  dropFolderId.value = dragged && !isShortcutFolder(dragged) ? folderTarget?.dataset.folderId ?? null : null;
  const fitted = fitPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY, drag.id);
  dragPosition.value = normalize(fitted.left, fitted.top);
}

function clearDrag() {
  drag = null;
  draggedId.value = null;
  dragPosition.value = null;
  dropFolderId.value = null;
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
    if (dropFolderId.value) {
      emit('moveToFolder', drag.id, dropFolderId.value);
    } else if (inGrid) {
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

function open(shortcut: ShortcutEntry) {
  if (shortcut.id === suppressedId && performance.now() < suppressedUntil) return;
  if (isShortcutFolder(shortcut)) activeFolderId.value = shortcut.id;
  else emit('open', shortcut);
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
    const page = main.closest('.home-page');
    if (page) layoutObserver.observe(page, { attributes: true, attributeFilter: ['data-dock-position'] });
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
  <div ref="barAnchor" :class="enabled ? 'shortcut-bar-anchor' : 'shortcut-bar-preview'" :style="enabled ? bar.anchorStyle.value : undefined">
  <section ref="barPanel" class="home-shortcuts" :class="{ 'shortcut-bar--enabled': enabled, 'shortcut-bar--dragging': bar.dragging.value }"
    :style="enabled ? bar.style.value : undefined" aria-labelledby="home-shortcuts-heading">
    <header class="shortcuts-header">
      <h2 id="home-shortcuts-heading">
        <button v-if="enabled" class="shortcut-bar-handle" type="button" aria-label="Move shortcuts bar" title="Drag to move · Arrow keys to adjust"
          :disabled="barLayout?.pinned || barBusy || busy || loading" @pointerdown="bar.start" @keydown="bar.keydown"><HomeIcon name="dots" /></button>
        <HomeIcon v-else name="dots" /><span class="shortcut-bar-title" :class="{ 'shortcut-bar-title--folder': activeFolder }">{{ activeFolder?.title ?? 'Frequent Shortcuts' }}</span>
      </h2>
      <div v-if="enabled" class="shortcut-bar-tools">
        <template v-if="activeFolder">
          <button class="shortcuts-alignment" type="button" aria-label="← Main bar" @click="activeFolderId = null">← Back</button>
          <button class="shortcuts-alignment" type="button" aria-label="Edit folder" :disabled="busy" @click="emit('edit', activeFolder)">Edit</button>
        </template>
        <button v-else class="shortcuts-alignment shortcut-new-folder" type="button" :disabled="busy || loading" @click="emit('addFolder')">+ New folder</button>
        <button class="shortcuts-alignment" type="button" :aria-pressed="barLayout?.pinned ?? false" :disabled="barBusy || loading"
          :aria-label="barLayout?.pinned ? 'Unpin shortcuts bar' : 'Pin shortcuts bar'"
          @click="emit('saveBar', { ...barLayout, pinned: !barLayout?.pinned })">{{ barLayout?.pinned ? 'Unpin' : 'Pin' }}</button>
      <button v-if="enabled && !activeFolder" class="shortcuts-alignment" type="button" title="Restore aligned positions and default order" :disabled="busy || loading || barBusy" @click="emit('resetLayout')"><span aria-hidden="true" />Reset layout</button>
      </div>
      <span v-if="!enabled" class="shortcuts-alignment"><span aria-hidden="true" />Grid Aligned</span>
    </header>

    <nav ref="grid" class="shortcut-items" aria-label="Frequent shortcuts" :aria-busy="loading">
      <div
        v-for="shortcut in items"
        :key="shortcut.id"
        class="shortcut-slot"
        :class="{ 'shortcut-slot--detached': enabled && shortcut.position, 'shortcut-folder-drop': dropFolderId === shortcut.id }"
        :data-folder-id="isShortcutFolder(shortcut) ? shortcut.id : undefined"
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
      <button class="shortcut-item shortcut-item--add" type="button" :disabled="!enabled || busy || loading" :title="enabled ? 'Add shortcut' : 'Adding shortcuts is not available yet'" @click="emit('add', activeFolder?.id ?? null)">
        <span class="shortcut-tile"><HomeIcon name="plus" /></span>
        <span class="shortcut-label">Add</span>
      </button>
    </nav>
  </section>
  </div>
</template>

<style scoped>
.shortcut-bar-preview { display: contents; }
.shortcut-bar-anchor { width: min(100%, 680px); flex: none; }
.shortcut-bar--enabled { width: 100%; }
.shortcut-bar--dragging { cursor: grabbing; }
.shortcut-bar-tools { display: flex; align-items: center; gap: 6px; }
.shortcut-bar-handle { display: grid; place-items: center; padding: 6px; border: 0; border-radius: 6px; background: transparent; cursor: grab; touch-action: none; }
.shortcut-bar-handle:disabled { cursor: default; opacity: .45; }
.shortcut-bar-handle:active:not(:disabled) { cursor: grabbing; }
.shortcut-bar--enabled .shortcuts-header { gap: 8px; flex-wrap: wrap; }
.shortcut-bar-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
.shortcut-bar--enabled .shortcuts-header h2 { min-width: 0; }
.shortcut-new-folder { color: #0071e3; }
@media (max-width: 480px) {
  .shortcut-bar--enabled .shortcut-bar-title:not(.shortcut-bar-title--folder) { display: none; }
  .shortcut-bar-title--folder { max-width: 64px; }
}
.shortcut-folder-drop { border-radius: 16px; outline: 2px solid #0071e3; background: rgb(0 113 227 / 15%); }
</style>
