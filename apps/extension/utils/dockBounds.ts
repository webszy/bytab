// Used only for collision bounds, never to position the Dock itself.
export function dockSafeBounds(width: number, height: number) {
  const dock = document.querySelector<HTMLElement>('.bookmark-dock');
  const rect = dock?.getBoundingClientRect();
  const edge = dock?.dataset.position ?? 'bottom';
  return {
    left: edge === 'left' && rect ? rect.right : 0,
    right: edge === 'right' && rect ? rect.left : width,
    top: Math.max(document.querySelector('.home-topbar')?.getBoundingClientRect().bottom ?? 56,
      edge === 'top' && rect ? rect.bottom : 0),
    bottom: edge === 'bottom' ? rect?.top ?? height - 80 : height,
  };
}
