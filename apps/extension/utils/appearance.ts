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
