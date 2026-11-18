import { onBeforeUnmount, onMounted, type Ref } from 'vue';
import { createGlassLens, supportsGlassLens } from '../utils/glassLens';
import { glassMaterial, loadGlassWallpaper, sampleGlassWallpaper, type GlassInk } from '../utils/glassScene';

const surfaces = [
  { selector: '.extension-prompt', lens: true, highlight: 0.08 },
  { selector: '.home-shortcuts', lens: true, highlight: 0.14 },
  { selector: '.bookmark-dock', lens: false, highlight: 0.14 },
  { selector: '.model-menu', lens: false, highlight: 0.14 },
  { selector: '.prompt-bookmarks', lens: false, highlight: 0.14 },
];

export function useExtensionGlass(root: Ref<HTMLElement | null>) {
  let dispose: (() => void) | undefined;
  onMounted(() => {
    const page = root.value;
    const backdrop = page?.querySelector<HTMLElement>('.home-background');
    if (!page || !backdrop) return;

    const dark = matchMedia('(prefers-color-scheme: dark)');
    const solid = matchMedia('(prefers-reduced-transparency: reduce), (forced-colors: active)');
    const supportsLens = supportsGlassLens();
    const lenses = new Map<HTMLElement, ReturnType<typeof createGlassLens>>();
    const inks = new Map<string, GlassInk>();
    for (const { selector } of surfaces) {
      try {
        const ink = localStorage.getItem('bytab.glassInk.' + selector);
        if (ink === 'dark' || ink === 'light') inks.set(selector, ink);
      } catch { /* In-memory hysteresis still works. */ }
    }
    const observed = new Set<HTMLElement>();
    const lastScene = new WeakMap<HTMLElement, string>();
    let wallpaper: Awaited<ReturnType<typeof loadGlassWallpaper>> | undefined;
    let source = '';
    let revision = 0;
    let stopped = false;
    let frame = 0;
    function schedule() {
      if (!stopped && !frame) frame = requestAnimationFrame(update);
    }
    const size = new ResizeObserver(schedule);
    function update() {
      frame = 0;
      if (!page || !backdrop) return;
      const image = getComputedStyle(backdrop).backgroundImage;
      if (image !== source) {
        source = image;
        wallpaper = undefined;
        const request = ++revision;
        void loadGlassWallpaper(image).then(result => {
          if (stopped || request !== revision) return;
          wallpaper = result;
          schedule();
        });
      }
      const bounds = backdrop.getBoundingClientRect();
      const present = new Set<HTMLElement>();
      for (const { selector, lens, highlight } of surfaces) {
        const element = page.querySelector<HTMLElement>(selector);
        if (!element) continue;
        present.add(element);
        if (!observed.has(element)) {
          size.observe(element);
          observed.add(element);
        }
        const rect = element.getBoundingClientRect();
        const dragging = element.classList.contains('shortcut-bar--dragging');
        const key = [revision, !!wallpaper, wallpaper === null, dark.matches, solid.matches, dragging,
          bounds.x, bounds.y, bounds.width, bounds.height, rect.x, rect.y, rect.width, rect.height,
          element.style.position].join('/');
        if (lastScene.get(element) === key) continue;
        lastScene.set(element, key);

        const previous = inks.get(selector);
        // During a drag use CSS glass and sample again at the final location.
        const material = !dragging && wallpaper && rect.width && rect.height && bounds.width && bounds.height
          ? glassMaterial(sampleGlassWallpaper(wallpaper, bounds, rect), dark.matches, previous, highlight) : null;
        const ink = material?.ink ?? (wallpaper === undefined || dragging ? previous : undefined);
        element.dataset.glassInk = dark.matches || ink === 'light' ? 'light' : 'dark';
        if (material && !dark.matches && previous !== material.ink) {
          inks.set(selector, material.ink);
          try { localStorage.setItem('bytab.glassInk.' + selector, material.ink); } catch { /* Optional cache. */ }
        }
        for (const [name, value] of [
          ['--glass-density', material?.density], ['--glass-saturation-kept', material?.saturationKept],
          ['--glass-contrast-floor', material?.contrastFloor],
        ] as const) {
          if (value === undefined) element.style.removeProperty(name);
          else element.style.setProperty(name, String(value));
        }

        const style = lens && supportsLens && !solid.matches && !dragging ? getComputedStyle(element) : null;
        if (!style || style.willChange !== 'auto' || style.transform !== 'none' || style.position === 'fixed'
          || Math.min(rect.width, rect.height) < 32) {
          lenses.get(element)?.remove();
          lenses.delete(element);
          continue;
        }
        let rim = lenses.get(element);
        if (!rim) { rim = createGlassLens(element); lenses.set(element, rim); }
        void rim.resize(rect.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth),
          rect.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth),
          parseFloat(style.borderTopLeftRadius), material?.texture ?? 0.5);
      }
      for (const element of observed) {
        if (present.has(element)) continue;
        size.unobserve(element);
        observed.delete(element);
        lenses.get(element)?.remove();
        lenses.delete(element);
      }
    }
    // Popovers mount inside the form. Only the page and the movable bar need
    // attribute observations; CSS-variable writes cannot change the scene key.
    const mutations = new MutationObserver(schedule);
    mutations.observe(page, { attributes: true, attributeFilter: ['style', 'data-dock-position'] });
    const form = page.querySelector('.extension-prompt');
    if (form) mutations.observe(form, { childList: true, subtree: true });
    const shortcuts = page.querySelector('.home-shortcuts');
    if (shortcuts) mutations.observe(shortcuts, { attributes: true, attributeFilter: ['style', 'class'] });
    size.observe(backdrop);
    dark.addEventListener('change', schedule);
    solid.addEventListener('change', schedule);
    window.addEventListener('resize', schedule);
    page.addEventListener('scroll', schedule, { capture: true, passive: true });
    void document.fonts.ready.then(schedule);
    schedule();

    dispose = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      size.disconnect();
      mutations.disconnect();
      dark.removeEventListener('change', schedule);
      solid.removeEventListener('change', schedule);
      window.removeEventListener('resize', schedule);
      page.removeEventListener('scroll', schedule, true);
      for (const rim of lenses.values()) rim.remove();
    };
  });
  onBeforeUnmount(() => dispose?.());
}
