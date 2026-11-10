<script setup lang="ts">
import { computed } from 'vue';
import { shortcutIcon, type Shortcut } from '../../utils/shortcuts';
import HomeIcon from './HomeIcon.vue';

const props = defineProps<{ shortcut: Shortcut; enabled?: boolean; busy?: boolean }>();
const emit = defineEmits<{
  open: [shortcut: Shortcut];
  edit: [shortcut: Shortcut];
  drag: [shortcut: Shortcut, event: PointerEvent];
}>();
const icon = computed(() => shortcutIcon(props.shortcut.url));
const initial = computed(() => Array.from(props.shortcut.title)[0]?.toLocaleUpperCase() ?? '');

function onClick(event: MouseEvent) {
  if (!props.enabled) return;
  event.preventDefault();
  emit('open', props.shortcut);
}

function onAuxClick(event: MouseEvent) {
  if (event.button === 1) onClick(event);
}

function onContextMenu(event: MouseEvent) {
  if (!props.enabled || props.busy) return;
  event.preventDefault();
  emit('edit', props.shortcut);
}
</script>

<template>
  <div class="shortcut-entry" :data-shortcut-id="shortcut.id">
    <a
      class="shortcut-item"
      :class="[`shortcut-item--${icon || 'website'}`, { 'shortcut-item--managed': enabled }]"
      :href="shortcut.url"
      :title="`${shortcut.title} · ${shortcut.url}`"
      :draggable="false"
      @click="onClick"
      @auxclick="onAuxClick"
      @pointerdown="enabled && !busy && emit('drag', shortcut, $event)"
      @contextmenu="onContextMenu"
    >
      <span class="shortcut-tile">
        <HomeIcon v-if="icon" :name="icon" />
        <span v-else class="shortcut-monogram" aria-hidden="true">{{ initial }}</span>
      </span>
      <span class="shortcut-label">{{ shortcut.title }}</span>
    </a>
    <button v-if="enabled" class="shortcut-edit" type="button" :aria-label="`Edit ${shortcut.title}`" :disabled="busy" @click="emit('edit', shortcut)">⋯</button>
  </div>
</template>
