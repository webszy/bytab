<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { BookmarkSearchEntry } from '../../utils/bookmarkTree';
import { searchPromptBookmarks } from '../../utils/promptBookmarks';
import { promptProviders, type PromptService } from '../../utils/promptProviders';
import { websiteLabel, websiteUrl } from '../../utils/urls';
import HomeIcon from './HomeIcon.vue';
import PromptProviderIcon from './PromptProviderIcon.vue';

const props = defineProps<{
  bookmarks?: BookmarkSearchEntry[];
  enabled?: boolean;
  providerLoading?: boolean;
  busy?: boolean;
  feedback?: string;
  openBookmarkUrl?: (title: string, url: string) => Promise<void>;
}>();
const providerId = defineModel<PromptService>('provider', { default: 'chatgpt' });
const emit = defineEmits<{
  send: [service: PromptService, prompt: string];
  clearFeedback: [];
}>();
const provider = computed(() => promptProviders.find(item => item.id === providerId.value)!);
const groups = ['AI Assistants', 'Web Search'] as const;
const available = promptProviders.filter(item => item.enabled);
const form = ref<HTMLFormElement | null>(null);
const input = ref<HTMLTextAreaElement | null>(null);
const selector = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const prompt = ref('');
const focused = ref(false);
const dismissed = ref(false);
const composing = ref(false);
let compositionEndedAt = -Infinity;
const menuOpen = ref(false);
const activeProvider = ref<PromptService>('chatgpt');
const selectedBookmarkIndex = ref(-1);
const bookmarkBusy = ref(false);
const bookmarkError = ref('');
const resultsHeight = ref(300);
let resizeObserver: ResizeObserver | undefined;
const busy = computed(() => props.busy || bookmarkBusy.value);
const results = computed(() => props.bookmarks ? searchPromptBookmarks(props.bookmarks, prompt.value) : []);
const visible = computed(() => focused.value && !dismissed.value && !menuOpen.value && results.value.length > 0);
const message = computed(() => bookmarkError.value || props.feedback);
const placeholder = computed(() => provider.value.group === 'Web Search' ? 'Search the web...' : 'Ask anything...');
const resultId = (entry: BookmarkSearchEntry) => `prompt-bookmark-${encodeURIComponent(entry.node.id)}`;
const activeDescendant = computed(() => {
  const entry = visible.value ? results.value[selectedBookmarkIndex.value] : undefined;
  return entry ? resultId(entry) : undefined;
});

watch(prompt, () => {
  selectedBookmarkIndex.value = -1;
  dismissed.value = false;
  bookmarkError.value = '';
  emit('clearFeedback');
}, { flush: 'sync' });
// Includes live Chrome bookmark edits/removals, even if the input stays the same.
watch(results, () => { selectedBookmarkIndex.value = -1; }, { flush: 'sync' });
watch(providerId, () => { selectedBookmarkIndex.value = -1; }, { flush: 'sync' });
watch(visible, value => {
  if (!value) selectedBookmarkIndex.value = -1;
  else void nextTick(measureResultsSpace);
}, { flush: 'sync' });

function measureResultsSpace() {
  if (!form.value) return;
  const dock = document.querySelector<HTMLElement>('.bookmark-dock');
  const bottom = dock?.dataset.position === 'bottom' ? dock.getBoundingClientRect().top : window.innerHeight;
  resultsHeight.value = Math.max(0, bottom - form.value.getBoundingClientRect().bottom - 24);
}

function dismissBookmarks() {
  dismissed.value = true;
  selectedBookmarkIndex.value = -1;
}

function isComposing(event?: KeyboardEvent) {
  return composing.value || event?.isComposing || event?.keyCode === 229
    || performance.now() - compositionEndedAt < 50;
}

function endComposition() {
  composing.value = false;
  // Some IMEs emit compositionend just before their confirming Enter keydown.
  compositionEndedAt = performance.now();
}

function submitProvider() {
  if (!props.enabled || isComposing() || busy.value || props.providerLoading || !prompt.value.trim()) return;
  dismissBookmarks();
  menuOpen.value = false;
  emit('send', providerId.value, prompt.value);
}

async function openBookmark(entry: BookmarkSearchEntry) {
  if (!props.openBookmarkUrl || busy.value || isComposing()) return;
  // Verify against the current candidates and validate again at the navigation boundary.
  const current = results.value.find(item => item.node.id === entry.node.id && item.node.url === entry.node.url);
  if (!current?.node.url || !websiteUrl(current.node.url)) return;
  bookmarkBusy.value = true;
  bookmarkError.value = '';
  dismissBookmarks();
  try {
    await props.openBookmarkUrl(current.node.title, current.node.url);
  } catch {
    bookmarkError.value = 'Could not open this bookmark. Try again.';
  } finally {
    bookmarkBusy.value = false;
  }
}

function onInputKeydown(event: KeyboardEvent) {
  if (isComposing(event)) return;
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (event.repeat) return;
    const entry = visible.value ? results.value[selectedBookmarkIndex.value] : undefined;
    if (entry) void openBookmark(entry);
    else void submitProvider();
  } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && visible.value) {
    event.preventDefault();
    const count = results.value.length;
    selectedBookmarkIndex.value = selectedBookmarkIndex.value === -1
      ? event.key === 'ArrowDown' ? 0 : count - 1
      : (selectedBookmarkIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + count) % count;
    void nextTick(() => form.value?.querySelector('[role="option"][aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }));
  } else if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    dismissBookmarks();
  }
}

async function focusProvider(id: PromptService) {
  activeProvider.value = id;
  await nextTick();
  selector.value?.querySelector<HTMLButtonElement>(`[data-provider="${id}"]`)?.focus();
}

function openMenu() {
  dismissBookmarks();
  menuOpen.value = true;
  measureResultsSpace();
  void focusProvider(providerId.value);
}

function closeMenu(restoreFocus = false) {
  menuOpen.value = false;
  if (restoreFocus) trigger.value?.focus();
}

function selectProvider(id: PromptService) {
  if (!available.some(item => item.id === id)) return;
  providerId.value = id;
  selectedBookmarkIndex.value = -1;
  closeMenu();
  dismissed.value = false;
  input.value?.focus();
}

function onMenuKeydown(event: KeyboardEvent) {
  const index = available.findIndex(item => item.id === activeProvider.value);
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    void focusProvider(available[(index + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length]!.id);
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    void focusProvider(available[event.key === 'Home' ? 0 : available.length - 1]!.id);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeMenu(true);
  }
}

function onOutside(event: PointerEvent) {
  if (!(event.target instanceof Node)) return;
  if (!selector.value?.contains(event.target)) closeMenu();
  if (!form.value?.contains(event.target)) dismissBookmarks();
}

function onFocusOut(event: FocusEvent) {
  if (!(event.relatedTarget instanceof Node) || !form.value?.contains(event.relatedTarget)) {
    focused.value = false;
    dismissBookmarks();
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onOutside);
  window.addEventListener('resize', measureResultsSpace);
  resizeObserver = new ResizeObserver(measureResultsSpace);
  if (form.value) resizeObserver.observe(form.value);
  measureResultsSpace();
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside);
  window.removeEventListener('resize', measureResultsSpace);
  resizeObserver?.disconnect();
});
</script>

<template>
  <form ref="form" class="home-prompt extension-prompt" :aria-label="enabled ? 'Prompt and bookmark search' : 'AI prompt preview'"
    :style="{ '--prompt-results-height': `${resultsHeight}px` }"
    @submit.prevent="submitProvider" @focusin="focused = true" @focusout="onFocusOut">
    <span class="prompt-symbol"><HomeIcon name="sparkle" /></span>
    <label class="sr-only" for="home-prompt-input">{{ placeholder }}</label>
    <textarea id="home-prompt-input" ref="input" v-model="prompt" class="prompt-input" rows="1" wrap="off"
      :placeholder="placeholder" autocomplete="off" spellcheck="false" :role="bookmarks ? 'combobox' : undefined"
      :aria-autocomplete="bookmarks ? 'list' : undefined" :aria-haspopup="bookmarks ? 'listbox' : undefined"
      :aria-expanded="bookmarks ? visible : undefined" :aria-controls="visible ? 'prompt-bookmarks' : undefined"
      :aria-activedescendant="activeDescendant" :aria-describedby="message ? 'prompt-feedback' : undefined"
      @keydown="onInputKeydown" @compositionstart="composing = true" @compositionend="endComposition" />
    <div class="prompt-actions">
      <div ref="selector" class="model-selector">
        <button ref="trigger" class="model-trigger" type="button" aria-label="Select provider" aria-haspopup="listbox"
          aria-controls="home-provider-options" :aria-expanded="menuOpen" :disabled="providerLoading"
          @click="menuOpen ? closeMenu() : openMenu()" @keydown.down.prevent="openMenu" @keydown.up.prevent="openMenu">
          <PromptProviderIcon :icon="provider.icon" />
          <span class="model-label">{{ provider.label }}</span><HomeIcon name="chevron" class="model-chevron" />
        </button>
        <div v-if="menuOpen" id="home-provider-options" class="model-menu" role="listbox" aria-label="AI and search providers" @keydown="onMenuKeydown">
          <div v-for="group in groups" :key="group" role="group" :aria-label="group">
            <div class="provider-group-label" aria-hidden="true">{{ group }}</div>
            <button v-for="item in promptProviders.filter(item => item.group === group)" :key="item.id"
              class="model-option" type="button" role="option" :data-provider="item.id" :disabled="!item.enabled"
              :aria-disabled="!item.enabled" :aria-selected="providerId === item.id" :tabindex="activeProvider === item.id ? 0 : -1"
              @click="selectProvider(item.id)">
              <PromptProviderIcon :icon="item.icon" /><span class="provider-name">{{ item.label }}</span>
              <span v-if="!item.enabled" class="provider-soon">Coming Soon</span>
              <span v-else-if="providerId === item.id" class="model-check" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>
      </div>
      <button class="prompt-send" type="submit" :title="enabled ? 'Open selected service' : 'Available in the Chrome extension'"
        :aria-label="enabled ? 'Open selected service' : 'Send prompt (available in the Chrome extension)'"
        :disabled="!enabled || providerLoading || busy || composing || !prompt.trim()" :aria-busy="busy"><HomeIcon name="send" /></button>
    </div>
    <div v-if="visible" id="prompt-bookmarks" class="prompt-bookmarks" role="listbox" aria-label="Matching bookmarks">
      <button v-for="(entry, index) in results" :id="resultId(entry)" :key="entry.node.id" class="prompt-bookmark"
        type="button" role="option" tabindex="-1" :aria-selected="selectedBookmarkIndex === index"
        :title="entry.node.url" @mousedown.prevent @click="openBookmark(entry)">
        <span class="prompt-bookmark-icon"><HomeIcon name="bookmark" /></span>
        <span class="prompt-bookmark-copy"><strong>{{ entry.node.title || websiteLabel(entry.node.url!) }}</strong>
          <small>{{ websiteLabel(entry.node.url!) }}</small></span>
        <HomeIcon name="chevron" />
      </button>
    </div>
    <div v-if="message" id="prompt-feedback" class="prompt-feedback" role="status">{{ message }}</div>
  </form>
</template>

<style scoped>
@property --bytab-prompt-ring-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0turn;
}

@keyframes prompt-ring-spin {
  to { --bytab-prompt-ring-angle: 1turn; }
}

.home-prompt.extension-prompt::before {
  box-shadow: var(--glass-edge), 0 0 8px 1px var(--prompt-focus-glow, transparent);
  transition: box-shadow 220ms ease;
}

.extension-prompt::after {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  pointer-events: none;
  background: conic-gradient(
    from var(--bytab-prompt-ring-angle, 0turn) in oklab,
    #c9b6ff,
    #a98bff 18%,
    #c9b6ff 33%,
    #ffd6e7 48%,
    #ffd9c3 57%,
    #c9b6ff 70%,
    #bfe3ff 80%,
    #a98bff 92%,
    #c9b6ff
  );
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 220ms ease;
  animation: prompt-ring-spin 7s linear infinite paused;
}

.extension-prompt:focus-within { --prompt-focus-glow: rgb(169 139 255 / 30%); }
.extension-prompt:focus-within::after { opacity: 1; animation-play-state: running; }

.prompt-send { background-color: #8c6bc8; color: #fff; }
.prompt-send:enabled:hover { background-color: #7b59b7; }
.prompt-send:enabled:active { background-color: #6b4aa6; }
.prompt-send:focus-visible { outline-color: #8c6bc8; }

@media (prefers-reduced-motion: reduce) {
  .extension-prompt::after { animation: none; }
}

textarea.prompt-input { resize: none; padding-top: 16px; padding-bottom: 16px; font-family: inherit; line-height: 22px; scrollbar-width: none; }
textarea.prompt-input::-webkit-scrollbar { display: none; }
.model-menu { width: 242px; max-width: calc(100vw - 32px); max-height: min(420px, 45svh, var(--prompt-results-height)); overflow-y: auto; }
.provider-group-label { padding: 8px 10px 4px; color: rgb(29 29 31 / 50%); font-size: 10px; font-weight: 600; }
.model-option { gap: 8px; }
.model-option:disabled { color: rgb(29 29 31 / 45%); cursor: default; background: transparent; }
.provider-name { flex: 1; }
.provider-soon { font-size: 9px; white-space: nowrap; }
.prompt-bookmarks { position: absolute; z-index: 50; top: calc(100% + 10px); left: 0; right: 0; padding: 6px; max-height: min(372px, 42svh, var(--prompt-results-height)); overflow-y: auto; border: 1px solid rgb(255 255 255 / 85%); border-radius: 18px; background: rgb(255 255 255 / 90%); backdrop-filter: blur(24px) saturate(170%); -webkit-backdrop-filter: blur(24px) saturate(170%); box-shadow: 0 12px 32px -6px rgb(0 0 0 / 16%); }
.prompt-bookmark { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 8px 12px; border: 0; border-radius: 12px; text-align: left; background: transparent; }
.prompt-bookmark:hover { background: rgb(0 0 0 / 5%); }
.prompt-bookmark[aria-selected='true'] { background: rgb(0 113 227 / 12%); box-shadow: inset 0 0 0 1px rgb(0 113 227 / 20%); }
.prompt-bookmark-icon { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border-radius: 10px; background: rgb(0 113 227 / 8%); color: #0071e3; }
.prompt-bookmark .home-icon { width: 16px; height: 16px; flex: none; }
.prompt-bookmark > .home-icon { color: rgb(29 29 31 / 40%); }
.prompt-bookmark-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
.prompt-bookmark-copy strong, .prompt-bookmark-copy small { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.prompt-bookmark-copy strong { font-size: 13px; font-weight: 600; }
.prompt-bookmark-copy small { color: rgb(29 29 31 / 55%); font-size: 11px; }
</style>
