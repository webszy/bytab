const svgNamespace = 'http://www.w3.org/2000/svg';
const lensProperty = '--bytab-glass-lens';
const mapCache = new Map<string, Promise<HTMLImageElement[]>>();
let nextLens = 0;

function svgNode<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number> = {}) {
  const node = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  return node;
}

function mapTiles(width: number, height: number, radius: number, rim: number) {
  const corner = Math.max(radius, rim);
  const right = width - corner;
  const bottom = height - corner;
  const middleWidth = width - 2 * corner;
  const middleHeight = height - 2 * corner;
  return [
    { x: 0, y: 0, width: corner, height: corner },
    { x: corner, y: 0, width: middleWidth, height: rim },
    { x: right, y: 0, width: corner, height: corner },
    { x: width - rim, y: corner, width: rim, height: middleHeight },
    { x: right, y: bottom, width: corner, height: corner },
    { x: corner, y: height - rim, width: middleWidth, height: rim },
    { x: 0, y: bottom, width: corner, height: corner },
    { x: 0, y: corner, width: rim, height: middleHeight },
  ];
}

async function buildMap(radius: number, rim: number) {
  // Generate small corner/edge tiles so resizing only moves the fixed-radius
  // corners and stretches the straight edges along their length.
  const side = 2 * Math.max(radius, rim) + 1;
  const center = side / 2;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Displacement map unavailable');
  const pixels = context.createImageData(side, side);

  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const px = x + 0.5 - center;
      const py = y + 0.5 - center;
      const dx = Math.abs(px) - (center - radius);
      const dy = Math.abs(py) - (center - radius);
      const cx = Math.max(0, dx);
      const cy = Math.max(0, dy);
      const length = Math.hypot(cx, cy);
      const depth = radius - length - Math.min(0, Math.max(dx, dy));
      const strength = Math.max(0, 1 - Math.max(0, depth) / rim) ** 2.6;
      const normalX = length ? cx / length : Number(dx >= dy);
      const normalY = length ? cy / length : Number(dy > dx);
      const index = (y * side + x) * 4;
      pixels.data[index] = 128 - Math.round(Math.sign(px) * normalX * 127 * strength);
      pixels.data[index + 1] = 128 - Math.round(Math.sign(py) * normalY * 127 * strength);
      pixels.data[index + 2] = 128;
      pixels.data[index + 3] = 255;
    }
  }

  return Promise.all(mapTiles(side, side, radius, rim).map(async tile => {
    canvas.width = tile.width;
    canvas.height = tile.height;
    context.putImageData(pixels, -tile.x, -tile.y);
    const source = canvas.toDataURL('image/png');
    const image = new Image();
    image.src = source;
    await image.decode();
    return image;
  }));
}

export function supportsGlassLens() {
  // Firefox can accept url() syntactically while dropping the displacement.
  return /\b(?:Chrome|Chromium)\/\d/.test(navigator.userAgent)
    && CSS.supports('backdrop-filter', 'url(#bytab-glass)');
}

export function createGlassLens(surface: HTMLElement) {
  const id = `bytab-glass-lens-${++nextLens}`;
  const svg = svgNode('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' });
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  const defs = svgNode('defs');
  const filter = svgNode('filter', {
    id, x: '0%', y: '0%', width: '100%', height: '100%',
    primitiveUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB',
  });
  const images = Array.from({ length: 8 }, (_, i) => svgNode('feImage', {
    preserveAspectRatio: 'none', result: `tile-${i}`,
  }));
  const map = svgNode('feMerge', { result: 'displacement' });
  map.append(svgNode('feMergeNode', { in: 'neutral' }));
  images.forEach((_, i) => map.append(svgNode('feMergeNode', { in: `tile-${i}` })));
  filter.append(svgNode('feFlood', { 'flood-color': '#808080', result: 'neutral' }), ...images, map);

  const channels = ['red', 'green', 'blue'].map((channel, i) => {
    const displacement = svgNode('feDisplacementMap', {
      in: 'SourceGraphic', in2: 'displacement', xChannelSelector: 'R', yChannelSelector: 'G', result: `bent-${channel}`,
    });
    const values = Array.from({ length: 20 }, (_, index) => Number(index === i * 6 || index === 18)).join(' ');
    filter.append(displacement, svgNode('feColorMatrix', {
      in: `bent-${channel}`, type: 'matrix', values, result: channel,
    }));
    return displacement;
  });
  filter.append(
    svgNode('feBlend', { in: 'red', in2: 'green', mode: 'screen', result: 'red-green' }),
    svgNode('feBlend', { in: 'red-green', in2: 'blue', mode: 'screen' }),
  );
  defs.append(filter);
  svg.append(defs);
  document.body.append(svg);

  let mapKey = '';
  let sizeKey = '';
  let scaleKey = '';
  return {
    async resize(width: number, height: number, cssRadius: number, texture: number) {
      const shortSide = Math.min(width, height);
      if (shortSide < 32) {
        mapKey = '';
        sizeKey = '';
        surface.style.removeProperty(lensProperty);
        return;
      }
      const radius = Math.max(0, Math.min(Math.round(cssRadius), Math.floor(shortSide / 2)));
      const rim = Math.max(4, Math.min(44, Math.round(shortSide / 3.5)));
      const key = `${radius}:${rim}`;
      const size = `${width}:${height}:${key}`;
      const sizeChanged = size !== sizeKey;
      if (sizeChanged) {
        sizeKey = size;
        mapTiles(width, height, radius, rim).forEach((tile, i) => {
          const image = images[i]!;
          for (const [name, value] of Object.entries(tile)) image.setAttribute(name, String(value));
        });
      }

      const maxOffset = 1.1 * rim;
      // Keep the bend and limit the color fringe over busy or wide rims.
      const fringe = 3 - 1.5 * texture;
      const split = Math.min(0.15, fringe / maxOffset);
      const scale = `${rim}:${split}`;
      if (scale !== scaleKey) {
        scaleKey = scale;
        channels.forEach((channel, i) => channel.setAttribute('scale', String(2 * maxOffset * (1 + (1 - i) * split))));
      }

      if (!sizeChanged || key === mapKey) return;
      mapKey = key;
      surface.style.removeProperty(lensProperty);
      let sources = mapCache.get(key);
      if (!sources) {
        sources = buildMap(radius, rim);
        mapCache.set(key, sources);
      }
      try {
        const decoded = await sources;
        if (mapKey !== key) return;
        images.forEach((image, i) => image.setAttribute('href', decoded[i]!.src));
        surface.style.setProperty(lensProperty, `url("#${id}")`);
      } catch {
        // Keep the CSS material and let a subsequent resize retry the decode.
        if (mapCache.get(key) === sources) mapCache.delete(key);
        if (mapKey === key) mapKey = '';
      }
    },
    remove() {
      mapKey = '';
      surface.style.removeProperty(lensProperty);
      svg.remove();
    },
  };
}
