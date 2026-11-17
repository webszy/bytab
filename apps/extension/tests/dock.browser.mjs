import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.BYTAB_PLAYWRIGHT_MODULE || 'playwright');
const extension = fileURLToPath(new URL('../dist/chrome-mv3', import.meta.url));
const output = fileURLToPath(new URL('../.output/dock-verification', import.meta.url));
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'bytab-dock-'));
const context = await chromium.launchPersistentContext(profile, {
  ...(process.env.BYTAB_CHROMIUM_EXECUTABLE ? { executablePath: process.env.BYTAB_CHROMIUM_EXECUTABLE } : { channel: 'chromium' }),
  headless: true, ignoreDefaultArgs: ['--disable-extensions'], viewport: { width: 1440, height: 1000 },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
const checks = [], errors = [];
const record = name => { checks.push(name); console.log(`PASS ${name}`); };
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
try {
  const page = await context.newPage(); page.setDefaultTimeout(5000); await page.goto('chrome://newtab/');
  const dock = page.locator('.bookmark-dock'), dialog = page.getByRole('dialog');
  await page.waitForFunction(() => !document.querySelector('[aria-label="Move shortcuts bar"]').disabled);
  assert.equal(await dock.getAttribute('data-position'), 'bottom');
  const fixture = await page.evaluate(async () => {
    const tree = await chrome.bookmarks.getTree(); const root = tree[0].children.find(x => x.folderType === 'bookmarks-bar') || tree[0].children[0];
    for (let i = 0; i < 24; i++) {
      const folder = await chrome.bookmarks.create({ parentId: root.id, title: `Dock folder ${i}` });
      await chrome.bookmarks.create({ parentId: folder.id, title: `Dock bookmark ${i}`, url: `https://example.test/${i}` });
    }
    await chrome.storage.local.set({ 'bytab.background': { kind: 'default', extra: { retained: true } }, 'bytab.promptProvider': 'claude' });
    return JSON.stringify(await chrome.bookmarks.getTree());
  });
  const setPosition = async position => {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await dialog.getByRole('button', { name: position, exact: true }).click();
    await page.waitForFunction(p => document.querySelector('.bookmark-dock').dataset.position === p, position.toLowerCase());
    await page.waitForFunction(async p => (await chrome.storage.local.get('bytab.background'))['bytab.background'].dockPosition === p, position.toLowerCase());
    assert.equal(await dialog.getByRole('button', { name: position, exact: true }).getAttribute('aria-pressed'), 'true');
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  };
  const overlaps = (a,b) => a.x < b.x+b.width-1 && a.x+a.width > b.x+1 && a.y < b.y+b.height-1 && a.y+a.height > b.y+1;
  const inViewport = (r,w,h) => r.x >= -1 && r.y >= -1 && r.x+r.width <= w+1 && r.y+r.height <= h+1;
  for (const position of ['Bottom', 'Top', 'Left', 'Right']) {
    await setPosition(position);
    await page.reload(); await dock.waitFor();
    await page.waitForFunction(p => document.querySelector('.bookmark-dock').dataset.position === p, position.toLowerCase());
    for (const [width, height] of [[1440,1000], [800,600], [400,700], [320,568], [900,400]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(150);
      const d = await dock.boundingBox(), horizontal = ['Bottom','Top'].includes(position);
      assert.ok(inViewport(d,width,height), `${position} Dock within ${width}x${height}: ${JSON.stringify(d)}`);
      assert.ok(horizontal ? Math.abs(d.width-Math.min(width*.9,1216)) < 2 : d.height <= height*.85+1);
      assert.ok(position === 'Bottom' ? Math.abs(d.y+d.height-height)<1 : position === 'Top' ? d.y===0 : position === 'Left' ? d.x===0 : Math.abs(d.x+d.width-width)<1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${position} page overflow ${width}`);
      for (const selector of ['.home-prompt', '.home-shortcuts', '.home-appearance']) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        const r = await page.locator(selector).boundingBox();
        assert.ok(!overlaps(d,r), `${position} overlaps ${selector} at ${width}x${height}: ${JSON.stringify(r)}`);
      }
      await page.getByRole('button', { name: 'All Bookmarks', exact: true }).click();
      const panel = page.locator('.bookmark-panel'); await panel.waitFor();
      const r = await panel.boundingBox();
      assert.ok(inViewport(r,width,height), `${position} panel within ${width}x${height}: ${JSON.stringify(r)}`);
      assert.ok(position === 'Bottom' ? r.y+r.height < d.y : position === 'Top' ? r.y > d.y+d.height : position === 'Left' ? r.x > d.x+d.width : r.x+r.width < d.x);
      await page.screenshot({ path: path.join(output, `${position.toLowerCase()}-${width}x${height}.png`) });
      await panel.getByRole('button', { name: 'Close bookmarks', exact: true }).click();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Search bookmarks', exact: true }).click();
    const search = page.locator('.bookmark-panel input'); await search.fill('Dock bookmark 23');
    await page.locator('.bookmark-panel').getByText('Dock bookmark 23', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'List view', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'List view', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Grid view', exact: true }).click();
    await search.press('Escape'); await search.press('Escape');
    await page.locator('.bookmark-panel').waitFor({ state: 'hidden' });
    if (!['Bottom','Top'].includes(position)) {
      const last = dock.getByRole('button', { name: 'Dock folder 23', exact: true });
      await last.click(); await page.locator('.bookmark-panel').getByText('Dock bookmark 23', { exact: true }).waitFor();
      await page.locator('.bookmark-panel').getByRole('button', { name: 'Close bookmarks', exact: true }).click();
      assert.equal(await dock.locator('.dock-folder-icon').first().evaluate(el => getComputedStyle(el).transform), 'none');
    }
    const stored = await page.evaluate(() => chrome.storage.local.get(null));
    assert.deepEqual(stored['bytab.background'].extra, { retained: true });
    assert.equal(stored['bytab.promptProvider'], 'claude');
    assert.equal(await page.evaluate(async () => JSON.stringify(await chrome.bookmarks.getTree())), fixture);
    record(`${position}: five viewport sizes, inward panel, search/view controls, reload persistence, stable bookmark order`);
  }
  // Persisted detached positions are refitted for every edge without rewriting user coordinates.
  await page.evaluate(() => chrome.storage.local.set({
    'bytab.shortcutBar': { pinned: true, position: { x: 0, y: 1 } },
    'bytab.shortcuts': [{ id: 'detached-test', title: 'Detached', url: 'https://example.test/detached', position: { x: 1, y: 1 } }],
  }));
  for (const position of ['Left', 'Right', 'Top', 'Bottom']) {
    await setPosition(position);
    const d = await dock.boundingBox();
    for (const selector of ['.shortcut-bar--enabled', '.shortcut-positioned']) {
      const r = await page.locator(selector).boundingBox();
      assert.ok(inViewport(r,1440,1000) && !overlaps(d,r), `${position}: safe detached ${selector}`);
    }
    assert.equal(await page.getByRole('button', { name: 'Move shortcuts bar', exact: true }).isDisabled(), true);
  }
  await page.getByRole('button', { name: 'Unpin shortcuts bar', exact: true }).click();
  const handle = page.getByRole('button', { name: 'Move shortcuts bar', exact: true });
  await handle.focus(); await handle.press('ArrowRight');
  await page.waitForFunction(async () => (await chrome.storage.local.get('bytab.shortcutBar'))['bytab.shortcutBar'].position.x > 0);
  await page.getByRole('button', { name: 'Reset layout', exact: true }).click();
  record('detached shortcut and pinned bar avoid all four edges; unpin/keyboard move still work');
  const second = await context.newPage(); await second.goto(page.url());
  await setPosition('Left');
  await second.waitForFunction(() => document.querySelector('.bookmark-dock').dataset.position === 'left');
  await second.close();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await dialog.locator('input[type=file]').setInputFiles(fileURLToPath(new URL('../assets/providers/google.png', import.meta.url)));
  await page.waitForFunction(() => !document.querySelector('.home-dialog .dialog-button--primary').disabled);
  await dialog.getByRole('button', { name: 'Right', exact: true }).click();
  await dialog.getByRole('button', { name: 'Apply background', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  const custom = await page.evaluate(async () => (await chrome.storage.local.get('bytab.background'))['bytab.background']);
  assert.equal(custom.kind, 'custom'); assert.equal(custom.dockPosition, 'right');
  await setPosition('Top');
  const preserved = await page.evaluate(async () => (await chrome.storage.local.get('bytab.background'))['bytab.background']);
  assert.equal(preserved.imageId, custom.imageId); assert.deepEqual(preserved.extra, { retained: true });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.home-page').style.getPropertyValue('--home-wallpaper').includes('blob:'));
  record('cross-tab position sync, background draft/apply preserves position, position preserves custom wallpaper and other settings');
  await page.getByRole('button', { name: 'Select provider' }).click();
  const logos = page.locator('.extension-prompt .model-avatar img');
  assert.ok(await logos.count() >= 6);
  await page.waitForFunction(() => [...document.querySelectorAll('.extension-prompt .model-avatar img')].every(img => img.complete && img.naturalWidth > 0));
  assert.equal(await logos.evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0 && (img.src.startsWith(location.origin) || img.src.startsWith('data:image/')))), true);
  record('all six official provider logos load from bundled extension assets');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2));
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
