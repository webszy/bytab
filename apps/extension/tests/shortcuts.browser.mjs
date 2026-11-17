import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.BYTAB_PLAYWRIGHT_MODULE || 'playwright');
const extension = fileURLToPath(new URL('../dist/chrome-mv3', import.meta.url));
const output = fileURLToPath(new URL('../.output/shortcuts-verification', import.meta.url));
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'bytab-shortcuts-'));
const context = await chromium.launchPersistentContext(profile, {
  ...(process.env.BYTAB_CHROMIUM_EXECUTABLE ? { executablePath: process.env.BYTAB_CHROMIUM_EXECUTABLE } : { channel: 'chromium' }),
  headless: true, ignoreDefaultArgs: ['--disable-extensions'], viewport: { width: 1440, height: 1000 },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
const checks = [], errors = [];
const record = name => { checks.push(name); console.log(`PASS ${name}`); };
context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
await context.addInitScript(() => {
  if (!globalThis.chrome?.tabs?.create) return;
  const native = chrome.tabs.create.bind(chrome.tabs);
  window.__targets = [];
  chrome.tabs.create = options => { window.__targets.push(options.url); return native({ ...options, url: 'about:blank' }); };
});
try {
  const page = await context.newPage(); page.setDefaultTimeout(5000); await page.goto('chrome://newtab/');
  const bar = page.locator('.shortcut-bar--enabled');
  const handle = page.getByRole('button', { name: 'Move shortcuts bar', exact: true });
  const dialog = page.getByRole('dialog');
  const stored = () => page.evaluate(() => chrome.storage.local.get(null));
  const drag = async (locator, dx, dy) => {
    const r = await locator.boundingBox();
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down();
    await page.mouse.move(r.x + r.width / 2 + dx, r.y + r.height / 2 + dy, { steps: 12 }); await page.mouse.up();
  };
  const waitSave = () => page.waitForFunction(() => !document.querySelector('[aria-label="Move shortcuts bar"]').disabled);
  await waitSave();
  const initial = await bar.boundingBox();
  const promptBefore = await page.locator('.extension-prompt').boundingBox();
  await drag(handle, -200, 100);
  await page.waitForFunction(async () => !!(await chrome.storage.local.get('bytab.shortcutBar'))['bytab.shortcutBar']?.position);
  await waitSave();
  const moved = await bar.boundingBox();
  assert.ok(Math.abs(moved.x - initial.x) > 100 && moved.y > initial.y + 50);
  const promptAfter = await page.locator('.extension-prompt').boundingBox();
  assert.ok(Math.abs(promptAfter.y - promptBefore.y) < 2, 'moving bar does not shift prompt');
  assert.equal(context.pages().length, 2, 'bar drag did not open a website');
  await page.getByRole('button', { name: 'Pin shortcuts bar', exact: true }).click();
  await page.waitForFunction(async () => (await chrome.storage.local.get('bytab.shortcutBar'))['bytab.shortcutBar']?.pinned === true);
  await page.reload(); await bar.waitFor();
  await page.getByRole('button', { name: 'Unpin shortcuts bar', exact: true }).waitFor();
  assert.equal(await handle.isDisabled(), true);
  const pinned = await bar.boundingBox();
  await drag(handle, 160, -80);
  const afterPinDrag = await bar.boundingBox();
  assert.ok(Math.abs(pinned.x - afterPinDrag.x) < 1 && Math.abs(pinned.y - afterPinDrag.y) < 1);
  assert.ok(Math.abs(pinned.x - moved.x) < 2 && Math.abs(pinned.y - moved.y) < 2);
  record('whole bar dragging, stable prompt layout, pin prevents movement, position/pin survive reload');

  await page.getByRole('button', { name: 'Unpin shortcuts bar', exact: true }).click(); await waitSave();
  await handle.focus(); await handle.press('ArrowRight'); await waitSave();
  assert.ok((await bar.boundingBox()).x > pinned.x);
  const second = await context.newPage(); await second.goto(page.url());
  await second.waitForFunction(() => getComputedStyle(document.querySelector('.shortcut-bar--enabled')).position === 'fixed');
  await page.getByRole('button', { name: 'Pin shortcuts bar', exact: true }).click();
  await second.getByRole('button', { name: 'Unpin shortcuts bar', exact: true }).waitFor(); await second.close();
  await page.getByRole('button', { name: 'Reset layout', exact: true }).click();
  await page.waitForFunction(async () => !(await chrome.storage.local.get('bytab.shortcutBar'))['bytab.shortcutBar']?.position);
  await page.getByRole('button', { name: 'Pin shortcuts bar', exact: true }).waitFor();
  record('unpin, keyboard adjustment, cross-tab layout sync and reset');

  await bar.getByRole('button', { name: '+ New folder', exact: true }).click();
  await dialog.getByLabel('Name', { exact: true }).fill('Work');
  await dialog.getByRole('button', { name: 'Save folder', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  await bar.getByRole('button', { name: 'Work', exact: true }).click();
  assert.equal(await bar.getByRole('button', { name: '+ New folder', exact: true }).count(), 0);
  await bar.getByRole('button', { name: 'Add', exact: true }).click();
  await dialog.getByLabel('Name', { exact: true }).fill('Docs');
  await dialog.getByLabel('Website URL').fill('https://example.test/docs');
  assert.notEqual(await dialog.getByLabel('Folder', { exact: true }).inputValue(), '');
  await dialog.getByRole('button', { name: 'Save shortcut', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  await bar.getByRole('link', { name: 'Docs', exact: true }).waitFor();
  const data = (await stored())['bytab.shortcuts'];
  const work = data.find(x => x.kind === 'folder');
  assert.equal(data.find(x => x.title === 'Docs').folderId, work.id);
  await page.reload(); await bar.getByRole('button', { name: 'Work', exact: true }).click();
  await bar.getByRole('link', { name: 'Docs', exact: true }).waitFor();
  record('create folder, add child shortcut, persist and enforce one folder level');

  await bar.getByRole('button', { name: 'Edit folder', exact: true }).click();
  assert.equal(await dialog.getByLabel('Folder', { exact: true }).count(), 0);
  await dialog.getByLabel('Name', { exact: true }).fill('Projects');
  await dialog.getByRole('button', { name: 'Save folder', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  await bar.getByText('Projects', { exact: true }).waitFor();
  await bar.getByRole('button', { name: 'Edit Docs', exact: true }).click();
  await dialog.getByLabel('Folder', { exact: true }).selectOption('');
  await dialog.getByRole('button', { name: 'Save shortcut', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  assert.equal(await bar.getByRole('link', { name: 'Docs', exact: true }).count(), 0);
  await bar.getByRole('button', { name: '← Main bar', exact: true }).click();
  await bar.getByRole('link', { name: 'Docs', exact: true }).waitFor();
  await bar.getByRole('button', { name: 'Edit Docs', exact: true }).click();
  await dialog.getByLabel('Folder', { exact: true }).selectOption(work.id);
  await dialog.getByRole('button', { name: 'Save shortcut', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  record('rename folder and move shortcut out/in using editor');

  const source = bar.getByRole('link', { name: 'GitHub', exact: true });
  const target = bar.getByRole('button', { name: 'Projects', exact: true });
  const src = await source.boundingBox(), dst = await target.boundingBox();
  await page.mouse.move(src.x + 25, src.y + 25); await page.mouse.down();
  await page.mouse.move(dst.x + 25, dst.y + 25, { steps: 14 }); await page.mouse.up();
  await page.waitForFunction(async folderId => (await chrome.storage.local.get('bytab.shortcuts'))['bytab.shortcuts'].find(x => x.id === 'github').folderId === folderId, work.id);
  await target.click(); await bar.getByRole('link', { name: 'GitHub', exact: true }).waitFor();
  const openedPromise = context.waitForEvent('page'); await bar.getByRole('link', { name: 'Docs', exact: true }).click();
  const opened = await openedPromise;
  assert.equal(await page.evaluate(() => window.__targets.at(-1)), 'https://example.test/docs');
  await opened.close(); await page.bringToFront();
  record('drag a shortcut into a folder and open a contained link without duplicate navigation');

  await bar.getByRole('button', { name: 'Edit folder', exact: true }).click();
  await dialog.getByRole('button', { name: 'Delete folder', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
  await bar.getByRole('link', { name: 'Docs', exact: true }).waitFor();
  await bar.getByRole('link', { name: 'GitHub', exact: true }).waitFor();
  assert.equal((await stored())['bytab.shortcuts'].filter(x => x.kind === 'folder').length, 0);
  record('delete folder returns all children to main bar with no link loss');

  await drag(handle, 100, 30); await waitSave();
  for (const [width, height] of [[1440, 1000], [800, 720], [400, 720], [320, 640]]) {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(() => document.querySelector('.shortcut-bar--enabled').getBoundingClientRect().right <= innerWidth);
    const rect = await bar.boundingBox();
    assert.ok(rect.x >= 0 && rect.x + rect.width <= width && rect.y + rect.height <= height - 80, JSON.stringify(rect));
    const dock = await page.locator('.bookmark-dock').boundingBox();
    assert.ok(Math.abs(dock.width - Math.min(width * .9, 1216)) < 2);
    assert.equal(await page.locator('.dock-surface').evaluate(x => getComputedStyle(x).borderTopLeftRadius), '36px');
    await page.screenshot({ path: path.join(output, `shortcuts-${width}x${height}.png`) });
  }
  record('bar remains in viewport on resize; Dock is centered 90% width with curved corners');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(`Verified ${checks.length} groups. ${output}`);
} finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
