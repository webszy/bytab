<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import HomeIcon from './HomeIcon.vue';

const models = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'google', label: 'Google' },
] as const;

const selectedIndex = ref(0);
const activeIndex = ref(0);
const menuOpen = ref(false);
const prompt = ref('');
const selector = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);

async function focusOption(index: number) {
  activeIndex.value = (index + models.length) % models.length;
  await nextTick();
  selector.value?.querySelectorAll<HTMLButtonElement>('[role="option"]')[activeIndex.value]?.focus();
}

function openMenu() {
  menuOpen.value = true;
  void focusOption(selectedIndex.value);
}

function closeMenu(restoreFocus = false) {
  menuOpen.value = false;
  if (restoreFocus) trigger.value?.focus();
}

function selectModel(index: number) {
  selectedIndex.value = index;
  closeMenu(true);
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    void focusOption(activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1));
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    void focusOption(event.key === 'Home' ? 0 : models.length - 1);
  } else if (event.key === 'Tab') {
    closeMenu();
  }
}

function onOutsidePointer(event: PointerEvent) {
  if (event.target instanceof Node && !selector.value?.contains(event.target)) closeMenu();
}

onMounted(() => { document.addEventListener('pointerdown', onOutsidePointer); });
onBeforeUnmount(() => { document.removeEventListener('pointerdown', onOutsidePointer); });
</script>

<template>
  <form class="home-prompt" aria-label="AI prompt preview" @submit.prevent>
    <span class="prompt-symbol"><HomeIcon name="sparkle" /></span>
    <label class="sr-only" for="home-prompt-input">Ask anything</label>
    <input
      id="home-prompt-input"
      v-model="prompt"
      class="prompt-input"
      type="text"
      placeholder="Ask anything..."
      autocomplete="off"
      spellcheck="false"
      aria-describedby="prompt-preview-help"
    />
    <span id="prompt-preview-help" class="sr-only">Model selection is available. Sending prompts is not available yet.</span>

    <div class="prompt-actions">
      <div ref="selector" class="model-selector" @keydown.esc.stop.prevent="closeMenu(true)">
        <button
          ref="trigger"
          class="model-trigger"
          type="button"
          aria-label="Select model"
          aria-haspopup="listbox"
          aria-controls="home-model-options"
          :aria-expanded="menuOpen"
          @click="menuOpen ? closeMenu() : openMenu()"
          @keydown.down.prevent="openMenu"
          @keydown.up.prevent="openMenu"
        >
          <span class="model-avatar" :class="`model-avatar--${models[selectedIndex]!.id}`">
            <HomeIcon v-if="selectedIndex === 0" name="chatgpt-mark" />
            <HomeIcon v-else-if="selectedIndex === 3" name="google" />
            <HomeIcon v-else-if="selectedIndex === 1" name="sparkle" />
            <span v-else aria-hidden="true">C</span>
          </span>
          <span class="model-label">{{ models[selectedIndex]!.label }}</span>
          <HomeIcon name="chevron" class="model-chevron" />
        </button>

        <div
          v-if="menuOpen"
          id="home-model-options"
          class="model-menu"
          role="listbox"
          aria-label="AI model"
          @keydown="onMenuKeydown"
        >
          <button
            v-for="(model, index) in models"
            :key="model.id"
            class="model-option"
            type="button"
            role="option"
            :aria-selected="selectedIndex === index"
            :tabindex="activeIndex === index ? 0 : -1"
            @click="selectModel(index)"
          >
            <span>{{ model.label }}</span>
            <span v-if="selectedIndex === index" class="model-check" aria-hidden="true">✓</span>
          </button>
        </div>
      </div>

      <button class="prompt-send" type="submit" title="Sending prompts is not available yet" aria-label="Send prompt (not available yet)" disabled>
        <HomeIcon name="send" />
      </button>
    </div>
  </form>
</template>
