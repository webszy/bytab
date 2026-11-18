import type { Ref } from 'vue';
import { createGlassLens, supportsGlassLens } from '~/utils/glassLens';
import { glassMaterial, loadGlassWallpaper, sampleGlassWallpaper, type GlassInk } from '~/utils/glassScene';

const surfaces = [
  { id: 'prompt', selector: '.extension-prompt', lens: true, rowHighlight: 0.08 },
  { id: 'models', selector: '.model-menu', lens: false, rowHighlight: 0.14 },
  { id: 'shortcuts', selector: '.home-shortcuts', lens: true, rowHighlight: 0.14 },
  { id: 'dock', selector: '.site-dock', lens: false, rowHighlight: 0.14 },
] as const;
const dialogDockInkId = 'dock:dialog';

function readPreference(key: string) {
  try {
    return localStorage.getItem(`bytab:web:glass:${key}`);
  } catch {
    return null;
  }
}

function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(`bytab:web:glass:${key}`, value);
  } catch {
    // Preferences still apply to the open page if storage is unavailable.
  }
}

export function useHomepageGlassTints() {
  return useState('homepage-glass-tints', () => ({ light: 1, dark: 1 }));
}

export function useHomepageGlass(root: Readonly<Ref<HTMLElement | null>>) {
  const tints = useHomepageGlassTints();
  const theme = ref<'light' | 'dark'>('light');
  let dispose: (() => void) | undefined;

  onMounted(() => {
    const homepage = root.value;
    const background = homepage?.querySelector<HTMLElement>('.home-background');
    if (!homepage || !background) return;

    for (const mode of ['light', 'dark'] as const) {
      const key = `tint:${mode}`;
      const stored = readPreference(key);
      const value = stored === null ? 1 : Number(stored);
      if (Number.isFinite(value)) tints.value[mode] = Math.min(1.5, Math.max(0, value));
      watch(() => tints.value[mode], strength => savePreference(key, String(strength)));
    }

    const darkTheme = matchMedia('(prefers-color-scheme: dark)');
    const solidGlass = matchMedia('(prefers-reduced-transparency: reduce), (forced-colors: active)');
    const lensSupported = supportsGlassLens();
    const featureLayer = homepage.querySelector('.feature-layer');
    const lenses = new Map<HTMLElement, ReturnType<typeof createGlassLens>>();
    const lastInks = new Map<string, GlassInk>();
    for (const id of [...surfaces.map(surface => surface.id), dialogDockInkId]) {
      const ink = readPreference(`ink:${id}`);
      if (ink === 'light' || ink === 'dark') lastInks.set(id, ink);
    }
    if (!darkTheme.matches) {
      const dialogOpen = featureLayer?.getAttribute('role') === 'dialog';
      for (const { id, selector } of surfaces) {
        const inkId = dialogOpen && id === 'dock' ? dialogDockInkId : id;
        if (lastInks.get(inkId) !== 'light') continue;
        const element = homepage.querySelector<HTMLElement>(selector);
        if (element) element.dataset.glassInk = 'light';
      }
    }

    let frame = 0;
    let stopped = false;
    let wallpaper: Awaited<ReturnType<typeof loadGlassWallpaper>> | undefined;
    let imageSource: string | undefined;
    const observed = new Set<HTMLElement>();
    const resize = new ResizeObserver(schedule);

    function schedule() {
      if (!stopped && !frame) frame = requestAnimationFrame(update);
    }

    function updateTheme() {
      theme.value = darkTheme.matches ? 'dark' : 'light';
      schedule();
    }

    const update = () => {
      frame = 0;
      const source = getComputedStyle(background).backgroundImage;
      if (source !== imageSource) {
        imageSource = source;
        wallpaper = undefined;
        void loadGlassWallpaper(source).then(image => {
          if (stopped || imageSource !== source) return;
          wallpaper = image;
          schedule();
        });
      }

      const bounds = background.getBoundingClientRect();
      const dialogOpen = featureLayer?.getAttribute('role') === 'dialog';
      const dark = darkTheme.matches;
      const allowedLens = lensSupported && !solidGlass.matches;
      const targets = surfaces.flatMap(part => {
        const element = homepage.querySelector<HTMLElement>(part.selector);
        if (!element) return [];
        const rect = element.getBoundingClientRect();
        const style = part.lens && allowedLens ? getComputedStyle(element) : undefined;
        return [{ part, element, rect, style }];
      });

      const toObserve = new Set([homepage, background, ...targets.map(({ element }) => element)]);
      for (const element of observed) {
        if (toObserve.has(element)) continue;
        resize.unobserve(element);
        observed.delete(element);
      }
      for (const element of toObserve) {
        if (observed.has(element)) continue;
        resize.observe(element);
        observed.add(element);
      }
      for (const [element, lens] of lenses) {
        if (allowedLens && toObserve.has(element)) continue;
        lens.remove();
        lenses.delete(element);
      }

      for (const { part, element, rect, style } of targets) {
        const dockUnderDialog = dialogOpen && part.id === 'dock';
        const inkId = dockUnderDialog ? dialogDockInkId : part.id;
        const previousInk = lastInks.get(inkId);
        const samples = wallpaper && bounds.width && bounds.height && rect.width && rect.height
          ? sampleGlassWallpaper(wallpaper, bounds, rect, dockUnderDialog)
          : null;
        const material = samples ? glassMaterial(samples, dark, previousInk, part.rowHighlight) : undefined;
        const ink = material?.ink ?? (wallpaper === undefined ? previousInk : undefined);
        if (!dark && ink === 'light') element.dataset.glassInk = ink;
        else delete element.dataset.glassInk;

        if (material) {
          element.style.setProperty('--glass-density', String(material.density));
          element.style.setProperty('--glass-saturation-kept', String(material.saturationKept));
          element.style.setProperty('--glass-contrast-floor', String(material.contrastFloor));
          if (!dark && material.ink !== previousInk) {
            lastInks.set(inkId, material.ink);
            savePreference(`ink:${inkId}`, material.ink);
          }
        } else {
          element.style.removeProperty('--glass-density');
          element.style.removeProperty('--glass-saturation-kept');
          element.style.removeProperty('--glass-contrast-floor');
        }

        const cornerShape = style?.getPropertyValue('corner-shape');
        if (!style || style.willChange !== 'auto' || style.transform !== 'none' || (cornerShape && cornerShape !== 'round')) {
          lenses.get(element)?.remove();
          lenses.delete(element);
          continue;
        }
        let lens = lenses.get(element);
        if (!lens) {
          lens = createGlassLens(element);
          lenses.set(element, lens);
        }
        const width = rect.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
        const height = rect.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);
        void lens.resize(width, height, parseFloat(style.borderTopLeftRadius), material?.texture ?? 0.5);
      }
    };

    // The model menu mounts on demand. Track scene attributes at their source
    // so setting style properties on the glass does not enqueue more sampling.
    const contentChanges = new MutationObserver(schedule);
    contentChanges.observe(homepage, { childList: true, subtree: true });
    const sceneChanges = new MutationObserver(schedule);
    const wallpaperAttributes = { attributes: true, attributeFilter: ['class', 'style'] };
    sceneChanges.observe(homepage, wallpaperAttributes);
    sceneChanges.observe(background, wallpaperAttributes);
    if (featureLayer) sceneChanges.observe(featureLayer, { attributes: true, attributeFilter: ['role'] });
    darkTheme.addEventListener('change', updateTheme);
    solidGlass.addEventListener('change', schedule);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    void document.fonts.ready.then(schedule);
    updateTheme();

    dispose = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      contentChanges.disconnect();
      sceneChanges.disconnect();
      darkTheme.removeEventListener('change', updateTheme);
      solidGlass.removeEventListener('change', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      for (const lens of lenses.values()) lens.remove();
    };
  });

  onBeforeUnmount(() => dispose?.());
  return {
    theme,
    tints: computed(() => ({
      '--glass-light-tint': tints.value.light,
      '--glass-dark-tint': tints.value.dark,
    })),
  };
}
