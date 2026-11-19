<script setup lang="ts">
const props = defineProps<{
  label: string;
  description: string;
  buttonClass: string;
  buttonId?: string;
  open: boolean;
  otherOpen: boolean;
  preferBelow?: boolean;
}>();
const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const anchor = useTemplateRef<HTMLElement>('anchor');
const trigger = useTemplateRef<HTMLButtonElement>('trigger');
const tip = useTemplateRef<HTMLElement>('tip');
const below = ref(false);
const tipId = useId();

function placeTooltip() {
  if (!props.open || !anchor.value || !tip.value) return;
  const rect = anchor.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceNeeded = tip.value.offsetHeight + 16;
  below.value = (props.preferBelow && spaceBelow >= spaceNeeded)
    || (rect.top < spaceNeeded && spaceBelow > rect.top);
}

function dismissOutside(event: Event) {
  const target = event.target;
  if (props.open && target instanceof Node && !trigger.value?.contains(target) && !tip.value?.contains(target)) {
    emit('update:open', false);
  }
}

function dismissOnEscape(event: KeyboardEvent) {
  if (!props.open || event.defaultPrevented || event.key !== 'Escape') return;
  event.preventDefault();
  emit('update:open', false);
  trigger.value?.focus({ preventScroll: true });
}

function focusTooltip() {
  if (props.open) tip.value?.focus({ preventScroll: true });
}

watch(() => props.open, (visible, _, onCleanup) => {
  if (!visible) return;
  placeTooltip();
  document.addEventListener('click', dismissOutside, true);
  document.addEventListener('focusin', dismissOutside);
  document.addEventListener('keydown', dismissOnEscape);
  window.addEventListener('resize', placeTooltip);
  window.addEventListener('scroll', placeTooltip, true);
  onCleanup(() => {
    document.removeEventListener('click', dismissOutside, true);
    document.removeEventListener('focusin', dismissOutside);
    document.removeEventListener('keydown', dismissOnEscape);
    window.removeEventListener('resize', placeTooltip);
    window.removeEventListener('scroll', placeTooltip, true);
  });
}, { flush: 'post' });
</script>

<template>
  <div ref="anchor" :class="{ 'tip-open': open }">
    <slot name="preview" />
    <button :id="buttonId" ref="trigger" type="button" :class="buttonClass" :aria-label="label"
      aria-haspopup="dialog" :aria-expanded="open" :aria-controls="tipId"
      @click="emit('update:open', !open)">
      <slot />
    </button>
    <Transition name="preview-tip" @after-enter="focusTooltip">
      <div v-show="open" :id="tipId" ref="tip" class="preview-tooltip"
        :class="{ below, 'preview-tooltip--hidden': otherOpen }"
        :role="open ? 'dialog' : undefined" :aria-label="label" tabindex="-1">
        <strong>Available in the Chrome extension</strong>
        <p>{{ description }}</p>
        <small>This website is a preview only.</small>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tip-open { z-index: 35; }
.preview-tooltip {
  position: absolute;
  inset-inline: 0;
  bottom: calc(100% + 10px);
  width: min(320px, 100%);
  margin-inline: auto;
  padding: 16px 18px;
  border: 1px solid rgb(255 255 255 / 60%);
  border-radius: 18px;
  color: var(--bytab-glass-ink);
  background: color-mix(in srgb, var(--glass-base-tint, light-dark(white, #141418)) 91%, transparent);
  backdrop-filter: blur(20px) saturate(140%);
  box-shadow: inset 0 1px 0 #ffffff40, 0 8px 24px #0002;
  font-size: 14px;
  line-height: 1.45;
  transform-origin: center bottom;
}
.preview-tooltip.below { top: calc(100% + 10px); bottom: auto; transform-origin: center top; }
.preview-tooltip--hidden { display: none; }
.preview-tooltip:focus { outline: none; }
.intro-hotspot--shortcuts .preview-tooltip { color: light-dark(#222328, #f5f5f7); }
.preview-tooltip p { margin: 5px 0 8px; }
.preview-tooltip small { color: var(--glass-secondary-ink); font-size: 12px; }
.preview-tip-enter-active, .preview-tip-leave-active { transition: opacity 140ms ease, transform 140ms ease; }
.preview-tip-enter-from, .preview-tip-leave-to { opacity: 0; transform: scale(.97); }
@media (prefers-reduced-motion: reduce) {
  .preview-tip-enter-active, .preview-tip-leave-active { transition: none; }
}
</style>
