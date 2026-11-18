type Rgb = [number, number, number];
export type GlassInk = 'dark' | 'light';

interface Wallpaper {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

interface GlassSamples {
  samples: Rgb[];
  contrastSamples: Rgb[];
}

function unit(value: number) {
  return Math.max(0, Math.min(1, value));
}

export async function loadGlassWallpaper(backgroundImage: string): Promise<Wallpaper | null> {
  const match = backgroundImage.match(/^url\((?:"([^"]+)"|'([^']+)'|([^)]*))\)$/);
  const source = match?.[1] ?? match?.[2] ?? match?.[3];
  if (!source) return null;

  try {
    const url = new URL(source, document.baseURI);
    if (url.origin !== location.origin && url.protocol !== 'data:') return null;
    const image = new Image();
    image.src = url.href;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(640, image.naturalWidth);
    canvas.height = Math.max(1, Math.round(canvas.width * image.naturalHeight / image.naturalWidth));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const { width, height } = canvas;
    return { width, height, pixels: context.getImageData(0, 0, width, height).data };
  } catch {
    return null;
  }
}

export function sampleGlassWallpaper(wallpaper: Wallpaper, background: DOMRectReadOnly, surface: DOMRectReadOnly, underDialog: boolean): GlassSamples {
  const scale = Math.max(background.width / wallpaper.width, background.height / wallpaper.height);
  const left = background.left + (background.width - wallpaper.width * scale) / 2;
  const top = background.top + (background.height - wallpaper.height * scale) / 2;
  const overlayAlpha = underDialog ? 0.15 : 0;

  function sampleGrid(columns: number, rows: number) {
    const pixels: Rgb[] = [];
    for (let row = 0; row < rows; row++) {
      const y = surface.top + surface.height * (row + 0.5) / rows;
      const sourceY = Math.min(wallpaper.height - 1, Math.floor(Math.max(0, (y - top) / scale)));
      const fraction = unit((y - background.top) / background.height);
      const gradient = fraction < 0.5 ? 0.3 * (1 - 2 * fraction) : 0.4 * (2 * fraction - 1);
      const wash = 0.1 + 0.9 * gradient;

      // Apply the wallpaper's white wash and the feature overlay behind the Dock.
      const blend = (channel: number, overlay: number) =>
        (wash + (1 - wash) * channel / 255) * (1 - overlayAlpha) + overlayAlpha * overlay / 255;
      for (let column = 0; column < columns; column++) {
        const x = surface.left + surface.width * (column + 0.5) / columns;
        const sourceX = Math.min(wallpaper.width - 1, Math.floor(Math.max(0, (x - left) / scale)));
        const index = (sourceY * wallpaper.width + sourceX) * 4;
        pixels.push([
          blend(wallpaper.pixels[index]!, 29),
          blend(wallpaper.pixels[index + 1]!, 29),
          blend(wallpaper.pixels[index + 2]!, 31),
        ]);
      }
    }
    return pixels;
  }

  const samples = sampleGrid(5, 3);
  // Keep the 5×3 grid for tone and density. Four extra points in each cell
  // catch small bright or dark details that matter to contrast.
  return { samples, contrastSamples: [...samples, ...sampleGrid(10, 6)] };
}

function relativeLuminance([r, g, b]: Rgb) {
  const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrastFloor(pixels: Rgb[], saturation: number, dark: boolean, lightInk: boolean, rowHighlight: number) {
  const brightness = dark ? 0.8 : lightInk ? 0.85 : 1.06;
  const tint = dark ? [20, 20, 24] : lightInk ? [16, 18, 22] : [255, 255, 255];
  const filtered = pixels.map(([r, g, b]) => {
    const gray = 0.213 * r + 0.715 * g + 0.072 * b;
    return [r, g, b].map(channel => unit(unit(gray + (channel - gray) * saturation) * brightness)) as Rgb;
  });
  const rimHighlight = dark ? 0.1 : 0.08;
  const wash = lightInk ? rimHighlight + (1 - rimHighlight) * rowHighlight : 0;

  function readable(alpha: number) {
    return filtered.every(pixel => {
      const surface = pixel.map((channel, i) => {
        const base = tint[i]! / 255;
        // Allow for the tint brightening on hover over dark glass.
        const tintChannel = lightInk ? base + (1 - base) * 0.02 : base;
        return wash + (1 - wash) * (channel * (1 - alpha) + tintChannel * alpha);
      }) as Rgb;
      const foreground = surface.map(channel => lightInk ? 0.94 + 0.06 * channel : 0.14 * channel) as Rgb;
      const a = relativeLuminance(surface) + 0.05;
      const b = relativeLuminance(foreground) + 0.05;
      return Math.max(a, b) / Math.min(a, b) >= 4.65;
    });
  }

  if (readable(0)) return 0;
  let lower = 0;
  let upper = 1;
  for (let step = 0; step < 10; step++) {
    const alpha = (lower + upper) / 2;
    if (readable(alpha)) upper = alpha;
    else lower = alpha;
  }
  return upper;
}

export function glassMaterial({ samples, contrastSamples }: GlassSamples, dark: boolean, previousInk: GlassInk | undefined, rowHighlight: number) {
  const sorted = samples.map(pixel => ({
    luminance: 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2],
    chroma: Math.max(...pixel) - Math.min(...pixel),
  })).sort((a, b) => a.luminance - b.luminance);
  const trimmed = sorted.slice(2, -2);
  const luminance = trimmed.reduce((sum, pixel) => sum + pixel.luminance, 0) / trimmed.length;
  const chroma = trimmed.reduce((sum, pixel) => sum + pixel.chroma, 0) / trimmed.length;
  const texture = sorted.at(-1)!.luminance - sorted[0]!.luminance;
  let ink: GlassInk = luminance < 0.5 ? 'light' : 'dark';
  if (dark) ink = 'light';
  else if (previousInk && Math.abs(luminance - 0.5) <= 0.05) ink = previousInk;

  const lightInk = ink === 'light';
  const closeness = lightInk ? luminance : 1 - luminance;
  const density = unit(0.55 * closeness + 0.7 * texture + 0.3 * chroma);
  const saturationKept = Math.max(0.45, 1 - 0.75 * chroma);
  const saturation = saturationKept * (dark ? 1.6 : lightInk ? 1.7 : 1.8);
  return {
    ink,
    density,
    texture,
    saturationKept,
    contrastFloor: contrastFloor(contrastSamples, saturation, dark, lightInk, rowHighlight),
  };
}
