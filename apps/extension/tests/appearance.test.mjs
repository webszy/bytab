import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAppearance, dockPositions } from '../utils/appearance.ts';

test('appearance supports legacy/default/invalid settings and preserves other fields', () => {
  for (const value of [null, [], 'left', undefined, { kind: 'default' }, { dockPosition: 'floating' }]) {
    assert.equal(parseAppearance(value).dockPosition, 'bottom');
  }
  const legacy = { kind: 'custom', imageId: 'wallpaper', theme: 'light', nested: { value: 42 } };
  for (const dockPosition of dockPositions) {
    assert.deepEqual(parseAppearance({ ...legacy, dockPosition }), { ...legacy, dockPosition });
  }
  assert.deepEqual(parseAppearance({ ...legacy, kind: 'default', dockPosition: 'right' }),
    { kind: 'default', theme: 'light', nested: { value: 42 }, dockPosition: 'right' });
  assert.equal(legacy.imageId, 'wallpaper');
});
