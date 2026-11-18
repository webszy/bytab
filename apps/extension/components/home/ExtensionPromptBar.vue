<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { BookmarkSearchEntry } from '../../utils/bookmarkTree';
import { searchPromptBookmarks } from '../../utils/promptBookmarks';
import { promptProviders, type PromptService } from '../../utils/promptProviders';
import { openWebsite } from '../../utils/navigation';
import { websiteLabel, websiteUrl } from '../../utils/urls';
import { useGeminiHandoff } from '../../composables/useGeminiHandoff';
import { usePromptNavigation } from '../../composables/usePromptNavigation';
import { usePromptProvider } from '../../composables/usePromptProvider';
import HomeIcon from './HomeIcon.vue';
import PromptProviderIcon from './PromptProviderIcon.vue';

const props = defineProps<{ bookmarks: BookmarkSearchEntry[] }>();
const { value: providerId, loading: providerLoading, error: providerError, saveError, select } = usePromptProvider();
const { busy: providerBusy, feedback, send } = usePromptNavigation();
const gemini = useGeminiHandoff();
const { notice, recoveryPrompt } = gemini;
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
const busy = computed(() => providerBusy.value || bookmarkBusy.value || gemini.busy.value);
const results = computed(() => searchPromptBookmarks(props.bookmarks, prompt.value));
const visible = computed(() => focused.value && !dismissed.value && !menuOpen.value && results.value.length > 0);
const message = computed(() => bookmarkError.value || feedback.value || saveError.value || providerError.value);
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
  feedback.value = '';
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

async function submitProvider() {
  if (isComposing() || busy.value || providerLoading.value || !prompt.value.trim()) return;
  dismissBookmarks();
  menuOpen.value = false;
  if (providerId.value === 'gemini') return gemini.send(prompt.value);
  gemini.dismiss();
  await send({ service: providerId.value, prompt: prompt.value });
}

async function openBookmark(entry: BookmarkSearchEntry) {
  if (busy.value || isComposing()) return;
  // Verify against the current candidates and validate again at the navigation boundary.
  const current = results.value.find(item => item.node.id === entry.node.id && item.node.url === entry.node.url);
  if (!current?.node.url || !websiteUrl(current.node.url)) return;
  bookmarkBusy.value = true;
  bookmarkError.value = '';
  dismissBookmarks();
  try {
    await openWebsite(current.node.title, current.node.url);
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
  select(id);
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
  <form ref="form" class="home-prompt extension-prompt" aria-label="Prompt and bookmark search"
    :style="{ '--prompt-results-height': `${resultsHeight}px` }"
    @submit.prevent="submitProvider" @focusin="focused = true" @focusout="onFocusOut">
    <span class="prompt-symbol"><HomeIcon name="sparkle" /></span>
    <label class="sr-only" for="home-prompt-input">{{ placeholder }}</label>
    <textarea id="home-prompt-input" ref="input" v-model="prompt" class="prompt-input" rows="1" wrap="off"
      :placeholder="placeholder" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list"
      aria-haspopup="listbox" :aria-expanded="visible" :aria-controls="visible ? 'prompt-bookmarks' : undefined"
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
      <button class="prompt-send" type="submit" title="Open selected service" aria-label="Open selected service"
        :disabled="providerLoading || busy || composing || !prompt.trim()" :aria-busy="busy"><HomeIcon name="send" /></button>
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
  <Teleport to="body">
    <Transition name="handoff">
      <aside v-if="notice" class="handoff-toast" aria-label="Gemini prompt handoff">
        <div role="status">
          <strong v-if="notice === 'copied'"><span aria-hidden="true">✓</span> Prompt copied!</strong>
          <strong v-else>{{ notice === 'copy-failed' ? "Couldn't copy prompt" : "Couldn't open Gemini" }}</strong>
          <p>{{ notice === 'copied' ? 'Paste it into Gemini to continue.' : 'You can also select and copy your prompt below.' }}</p>
        </div>
        <template v-if="notice !== 'copied'">
          <textarea readonly aria-label="Prompt to copy" :value="recoveryPrompt" @focus="($event.target as HTMLTextAreaElement).select()" />
          <div class="handoff-actions">
            <button type="button" :disabled="busy" @click="gemini.recover(true)">Copy Prompt</button>
            <button type="button" :disabled="busy" @click="gemini.recover(false)">Open Gemini</button>
            <button type="button" :disabled="busy" @click="gemini.dismiss">Dismiss</button>
          </div>
        </template>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Extension-only: the website retains its existing shared PromptBar preview. */
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
.handoff-toast { position: fixed; z-index: 100; right: 18px; bottom: 18px; box-sizing: border-box; max-width: calc(100vw - 36px); padding: 14px 18px; border: 1px solid #ffffff38; border-radius: 16px; background: rgb(25 27 34 / 94%); color: white; backdrop-filter: blur(18px); box-shadow: 0 6px 24px #0003; font: 14px/1.4 system-ui, sans-serif; }
.handoff-toast strong span { color: #8de2b0; }
.handoff-toast p { margin: 4px 0 0; color: #e3e4ea; }
.handoff-toast textarea { box-sizing: border-box; width: 100%; margin: 10px 0; }
.handoff-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.handoff-actions button { padding: 5px 9px; border: 1px solid #ffffff54; border-radius: 8px; background: transparent; color: white; cursor: pointer; }
.handoff-enter-active, .handoff-leave-active { transition: opacity 150ms; }
.handoff-enter-from, .handoff-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .handoff-enter-active, .handoff-leave-active { transition: none; } }
</style>
