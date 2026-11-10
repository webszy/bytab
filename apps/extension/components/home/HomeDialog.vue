<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue';

defineProps<{ title: string; busy?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
let previousFocus: HTMLElement | null = null;

onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  dialog.value?.showModal();
});
onBeforeUnmount(() => {
  dialog.value?.close();
  if (previousFocus?.isConnected) previousFocus.focus();
});
</script>

<template>
  <dialog ref="dialog" class="home-dialog" :aria-labelledby="titleId" @cancel.prevent="!busy && emit('close')">
    <header class="dialog-heading">
      <h2 :id="titleId">{{ title }}</h2>
      <button class="dialog-close" type="button" aria-label="Close" :disabled="busy" @click="emit('close')">×</button>
    </header>
    <slot />
  </dialog>
</template>
