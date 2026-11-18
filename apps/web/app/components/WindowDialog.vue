<script setup lang="ts">
const props = withDefaults(defineProps<{
  id?: string;
  open: boolean;
  title?: string;
  description?: string;
  keepMounted?: boolean;
  returnFocusId?: string;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}>(), { restoreFocus: true, trapFocus: true });
const emit = defineEmits<{ close: [] }>();
const layer = useTemplateRef<HTMLElement>('layer');
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton');
const instanceId = useId();
const titleId = computed(() => `${props.id ?? instanceId}-title`);
const summaryId = computed(() => `${props.id ?? instanceId}-summary`);
let previousFocus: HTMLElement | null = null;

function onKeydown(event: KeyboardEvent) {
  if (!props.open || event.defaultPrevented) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('close');
    return;
  }
  if (event.key !== 'Tab' || !props.trapFocus || !layer.value) return;

  const elements = [...layer.value.querySelectorAll<HTMLElement>(
    'a[href], button, input, select, textarea, summary, [tabindex]',
  )].filter(element =>
    element.tabIndex >= 0 && !element.matches(':disabled') &&
    element.getClientRects().length > 0 && !element.closest('[inert]'),
  );
  const first = elements[0];
  const last = elements.at(-1);
  const active = document.activeElement;
  if (active === (event.shiftKey ? first : last) || !layer.value.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown, true);
  watch([() => props.open, () => props.returnFocusId], async ([open], [wasOpen, returnFocusId]) => {
    if (open === wasOpen) return;
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await nextTick();
      if (props.open) closeButton.value?.focus({ preventScroll: true });
    } else if (wasOpen) {
      const opener = previousFocus;
      previousFocus = null;
      await nextTick();
      if (props.open || !props.restoreFocus) return;
      const fallback = returnFocusId ? document.getElementById(returnFocusId) : null;
      const target = opener?.isConnected && opener !== document.body && !opener.closest('[inert]') ? opener : fallback;
      target?.focus({ preventScroll: true });
    }
  }, { immediate: true });
});

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown, true));
</script>

<template>
  <section
    :id="id"
    ref="layer"
    class="window-dialog-layer"
    :role="open ? 'dialog' : undefined"
    :aria-modal="open ? true : undefined"
    :aria-labelledby="open ? titleId : undefined"
    :aria-describedby="open && description ? summaryId : undefined"
  >
    <Transition name="window-dialog" @before-leave="element => element.setAttribute('inert', '')">
      <div
        v-if="open || keepMounted"
        v-show="open"
        class="window-dialog-overlay"
        :inert="!open"
        @click.self="emit('close')"
      >
        <div class="window-dialog-panel">
          <header class="window-titlebar">
            <div class="window-controls">
              <button ref="closeButton" class="window-close" type="button" aria-label="Close window" @click="emit('close')">
                <span class="window-dot window-dot--red" aria-hidden="true">
                  <span class="window-close-symbol">×</span>
                </span>
              </button>
              <span class="window-dot window-dot--yellow" aria-hidden="true" />
              <span class="window-dot window-dot--green" aria-hidden="true" />
            </div>
            <h2 :id="titleId">{{ title }}</h2>
            <p v-if="description" :id="summaryId" hidden>{{ description }}</p>
          </header>
          <div class="window-dialog-body"><slot /></div>
        </div>
      </div>
    </Transition>
    <slot name="outside" />
  </section>
</template>

<style scoped>
.window-dialog-layer {
  --window-backdrop: rgb(29 29 31 / 15%);
  --window-surface: #fff;
  --window-ink: #1d1d1f;
  --window-titlebar: linear-gradient(#fafafa, #eeedf3);
  --window-border: rgb(255 255 255 / 80%);
  --window-divider: rgb(0 0 0 / 8%);
  --window-dot-edge: rgb(0 0 0 / 8%);
  --window-focus: #0071e3;
  --window-shadow: 0 24px 80px -16px rgb(0 0 0 / 24%), 0 8px 24px -8px rgb(0 0 0 / 12%);
  position: fixed;
  z-index: 40;
  inset: 0;
  pointer-events: none;
}

:global([data-theme='dark'] .window-dialog-layer) {
  --window-color-scheme: dark;
  --window-backdrop: rgb(0 0 0 / 34%);
  --window-surface: #252528;
  --window-ink: #f5f5f7;
  --window-titlebar: linear-gradient(#37373d, #2c2c31);
  --window-border: rgb(255 255 255 / 16%);
  --window-divider: rgb(0 0 0 / 40%);
  --window-dot-edge: rgb(0 0 0 / 24%);
  --window-focus: #7bb8ff;
  --window-shadow: 0 24px 80px -16px rgb(0 0 0 / 62%), 0 8px 24px -8px rgb(0 0 0 / 32%);
}

.window-dialog-overlay {
  --window-padding: 24px;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--window-padding) var(--window-padding) calc(var(--window-bottom-inset, 0px) + var(--window-padding));
  background: var(--window-backdrop);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.window-dialog-panel {
  display: flex;
  width: min(var(--window-width, 880px), 100%);
  max-height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--window-border);
  border-radius: 18px;
  background: var(--window-surface);
  box-shadow: var(--window-shadow);
  color: var(--window-ink);
  color-scheme: var(--window-color-scheme, light);
}

.window-titlebar {
  --window-control-width: 24px;
  --window-controls-width: calc(3 * var(--window-control-width));
  display: grid;
  min-height: 50px;
  flex: none;
  grid-template-columns: minmax(var(--window-controls-width), 1fr) minmax(0, auto) minmax(var(--window-controls-width), 1fr);
  align-items: center;
  gap: 8px;
  padding-inline: 12px;
  border-bottom: 1px solid var(--window-divider);
  background: var(--window-titlebar);
}

.window-titlebar h2 {
  margin: 0;
  padding-block: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.25;
  overflow-wrap: anywhere;
  text-align: center;
}

.window-controls {
  display: grid;
  grid-template-columns: repeat(3, var(--window-control-width));
  grid-auto-rows: 36px;
  place-items: center;
  justify-self: start;
}

.window-close {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
}

.window-controls .window-close:focus-visible {
  outline: 2px solid var(--window-focus);
  outline-offset: -2px;
}

.window-dot {
  display: grid;
  width: 12px;
  height: 12px;
  place-items: center;
  border: 1px solid var(--window-dot-edge);
  border-radius: 50%;
}

.window-dot--red {
  background: #ff5f57;
  color: #681915;
  font: 700 12px/10px system-ui, sans-serif;
}

.window-dot--yellow { background: #febc2e; }
.window-dot--green { background: #28c840; }
.window-close-symbol { visibility: hidden; }
.window-close:focus-visible .window-close-symbol,
.window-close:active .window-close-symbol { visibility: visible; }
.window-close:active .window-dot--red { background: #e64a43; }

@media (hover: hover) {
  .window-controls:hover .window-close-symbol { visibility: visible; }
}

.window-dialog-body {
  min-height: 0;
  overflow: auto;
}

@media (max-width: 620px) {
  .window-dialog-overlay {
    --window-padding: 16px;
    padding-inline: 12px;
  }
  .window-dialog-panel { border-radius: 14px; }
  .window-titlebar { padding-inline: 10px; }
  .window-titlebar h2 { font-size: 12px; }
}

@media (prefers-reduced-motion: no-preference) {
  .window-dialog-enter-active,
  .window-dialog-leave-active { transition: opacity 180ms ease; }
  .window-dialog-enter-active .window-dialog-panel,
  .window-dialog-leave-active .window-dialog-panel { transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1); }
  .window-dialog-enter-from,
  .window-dialog-leave-to { opacity: 0; }
  .window-dialog-enter-from .window-dialog-panel,
  .window-dialog-leave-to .window-dialog-panel { transform: translateY(8px) scale(0.98); }
}
</style>
