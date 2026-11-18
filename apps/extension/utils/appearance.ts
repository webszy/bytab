export const dockPositions = ['bottom', 'top', 'left', 'right'] as const;
export type DockPosition = typeof dockPositions[number];
export type AppearanceSettings = Record<string, unknown> & { dockPosition: DockPosition } & (
  { kind: 'default' } | { kind: 'custom'; imageId: string }
);

export function parseAppearance(value: unknown): AppearanceSettings {
  const source = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const dockPosition = dockPositions.includes(source.dockPosition as DockPosition)
    ? source.dockPosition as DockPosition : 'bottom';
  if (source.kind === 'custom' && typeof source.imageId === 'string' && source.imageId) {
    return { ...source, kind: 'custom', imageId: source.imageId, dockPosition };
  }
  const { imageId: _unused, ...rest } = source;
  return { ...rest, kind: 'default', dockPosition };
}

export type GlassMode = 'light' | 'dark';

export function readGlassTints(settings: AppearanceSettings): Record<GlassMode, number> {
  const tints = settings.glassTints;
  const values = typeof tints === 'object' && tints !== null ? tints as Record<string, unknown> : {};
  function strength(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1.5, value)) : 1;
  }
  return { light: strength(values.light), dark: strength(values.dark) };
}
