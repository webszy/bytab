<script setup lang="ts">
defineProps<{
  label: string;
  description: string;
  buttonClass: string;
  buttonId?: string;
}>();

const anchor = useTemplateRef<HTMLElement>('anchor');
const tip = useTemplateRef<HTMLElement>('tip');
const open = ref(false);
const below = ref(false);
const tipId = useId();
const route = useRoute();

function placeTooltip() {
  if (!open.value || !anchor.value || !tip.value) return;
  const rect = anchor.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  below.value = rect.top < tip.value.offsetHeight + 16 && spaceBelow > rect.top;
}

function dismissOutside(event: Event) {
  if (event.target instanceof Node && !anchor.value?.contains(event.target)) open.value = false;
}

function dismissOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false;
}

watch(() => route.fullPath, () => { open.value = false; });
watch(open, (visible, _, onCleanup) => {
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
    <button :id="buttonId" type="button" :class="buttonClass" :aria-label="label"
      :aria-expanded="open" :aria-controls="tipId" :aria-describedby="open ? tipId : undefined"
      @click="open = !open">
      <slot />
    </button>
    <Transition name="preview-tip">
      <div v-show="open" :id="tipId" ref="tip" class="preview-tooltip" :class="{ below }" role="tooltip">
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
.intro-hotspot--shortcuts .preview-tooltip { color: light-dark(#222328, #f5f5f7); }
.preview-tooltip p { margin: 5px 0 8px; }
.preview-tooltip small { color: var(--glass-secondary-ink); font-size: 12px; }
.preview-tip-enter-active, .preview-tip-leave-active { transition: opacity 140ms ease, transform 140ms ease; }
.preview-tip-enter-from, .preview-tip-leave-to { opacity: 0; transform: scale(.97); }
@media (prefers-reduced-motion: reduce) {
  .preview-tip-enter-active, .preview-tip-leave-active { transition: none; }
}
</style>
