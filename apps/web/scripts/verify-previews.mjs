import assert from 'node:assert/strict';
import { siteFeatures } from '../shared/site.ts';

const { chromium } = await import(process.env.BYTAB_PLAYWRIGHT_MODULE || 'playwright');
const base = new URL(process.env.BYTAB_TEST_BASE_URL || 'http://localhost:3001');
const home = new URL('/', base).href;
const browser = await chromium.launch({
  ...(process.env.BYTAB_CHROMIUM_EXECUTABLE ? { executablePath: process.env.BYTAB_CHROMIUM_EXECUTABLE } : { channel: 'chromium' }),
});

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const prompt = page.locator('#intro-prompt');
  const shortcuts = page.locator('#intro-shortcuts');
  const popups = page.locator('.preview-tooltip:visible');
  const openHome = async () => {
    await page.goto(home);
    await page.waitForFunction(() => /\d/.test(document.querySelector('.home-time')?.textContent ?? ''));
  };
  const checkOpen = async (active = null) => {
    for (const trigger of [prompt, shortcuts]) {
      assert.equal(await trigger.getAttribute('aria-expanded'), String(trigger === active));
    }
    if (active) {
      const controls = await active.getAttribute('aria-controls');
      assert.ok(controls);
      assert.equal(await popups.count(), 1);
      assert.equal(await popups.getAttribute('id'), controls);
    } else {
      await popups.first().waitFor({ state: 'hidden' });
      assert.equal(await popups.count(), 0);
    }
  };

  await openHome();
  assert.equal(await page.getByText('Start your day. Start with bytab.', { exact: true }).count(), 1);
  const install = page.locator('.chrome-install');
  if (await install.getAttribute('href') === null) {
    assert.equal(await install.textContent(), 'Coming Soon');
    assert.ok(await install.isDisabled());
  } else {
    assert.match(await install.getAttribute('href'), /^https:\/\/chromewebstore\.google\.com\/detail\//);
  }
  assert.equal(await prompt.evaluate(button => button.tagName + ':' + button.type), 'BUTTON:button');
  const placeholder = prompt.locator('.prompt-input');
  assert.equal(await placeholder.evaluate(node => node.tagName + ':' + getComputedStyle(node).cursor), 'SPAN:pointer');
  assert.equal(await page.locator('.prompt-preview :is(input, textarea, [contenteditable], form, a)').count(), 0);
  for (let tab = 0; tab < 8 && !(await prompt.evaluate(node => document.activeElement === node)); tab++) {
    await page.keyboard.press('Tab');
  }
  assert.ok(await prompt.evaluate(node => document.activeElement === node), 'Tab reaches the Prompt Bar');
  await page.waitForLoadState('networkidle');
  const promptRequests = [];
  const capturePromptRequests = request => {
    const url = new URL(request.url());
    const sameOrigin = url.origin === base.origin;
    // Nuxt fetches its build manifests in the background on production pages.
    if (sameOrigin && request.method() === 'GET'
      && /^\/_nuxt\/builds\/(?:latest|meta\/[a-f0-9-]+)\.json$/.test(url.pathname)) return;
    if (request.method() !== 'GET' || ['fetch', 'xhr', 'websocket'].includes(request.resourceType())
      || !sameOrigin) promptRequests.push(request.url());
  };
  page.on('request', capturePromptRequests);
  for (const key of ['Enter', 'Space']) {
    await prompt.press(key);
    await checkOpen(prompt);
    await prompt.press(key);
    await checkOpen();
  }
  await prompt.click();
  await checkOpen(prompt);
  await page.keyboard.type('test123');
  await page.keyboard.insertText('输入法');
  assert.equal(await prompt.evaluate(button => {
    const data = new DataTransfer();
    data.setData('text/plain', 'pasted text');
    button.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
    return button.querySelector('.prompt-input').textContent;
  }), 'Ask anything...');
  assert.equal(await page.locator('.model-menu').count(), 0);
  assert.equal(page.url(), home);
  assert.equal(context.pages().length, 1);
  assert.deepEqual(promptRequests, []);
  page.off('request', capturePromptRequests);
  console.log('PASS Prompt preview: mouse, Tab, Enter, Space, typing, paste, IME-style insertion, and network isolation');

  await popups.getByText('This website is a preview only.').click();
  await checkOpen(prompt);
  // A pointer press on the other trigger must leave the current tip open until click.
  const box = await shortcuts.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await checkOpen(prompt);
  await page.mouse.up();
  await checkOpen(shortcuts);
  await shortcuts.click();
  await checkOpen();
  await shortcuts.click();
  await prompt.click();
  await checkOpen(prompt);
  await prompt.click();
  await checkOpen();
  for (const trigger of [prompt, shortcuts]) {
    await trigger.click();
    await page.mouse.click(4, 4);
    await checkOpen();
    await trigger.click();
    await page.keyboard.press('Escape');
    await checkOpen();
    assert.ok(await trigger.evaluate(node => document.activeElement === node), 'Escape restores the trigger focus');
  }

  await prompt.click();
  await checkOpen(prompt);
  await page.waitForFunction(() => document.activeElement?.classList.contains('preview-tooltip'));
  const maxVisible = await page.evaluate(async () => {
    const promptButton = document.getElementById('intro-prompt');
    const shortcutsButton = document.getElementById('intro-shortcuts');
    const buttons = [shortcutsButton, shortcutsButton, promptButton, shortcutsButton, promptButton, promptButton];
    let maximum = 0;
    for (const button of buttons) {
      button.click();
      for (let frame = 0; frame < 3; frame++) {
        await new Promise(requestAnimationFrame);
        const visible = [...document.querySelectorAll('.preview-tooltip')].filter(tip => {
          const style = getComputedStyle(tip);
          return style.display !== 'none' && Number(style.opacity) > 0;
        });
        maximum = Math.max(maximum, visible.length);
      }
    }
    return maximum;
  });
  assert.equal(maxVisible, 1, 'opening and leaving transitions never draw two tooltips');
  await checkOpen();
  console.log('PASS tooltip switching: both directions, same-trigger toggle, inside/outside clicks, Escape, and rapid transitions');

  await prompt.click();
  await page.locator('#home-settings').click();
  const settings = page.getByRole('dialog', { name: 'Appearance' });
  assert.ok(await settings.isVisible());
  await checkOpen();
  await settings.getByRole('button', { name: 'Close', exact: true }).click();

  for (const feature of siteFeatures) {
    await shortcuts.click();
    const dockLink = page.locator(`#dock-${feature.id}`);
    assert.equal(await dockLink.getAttribute('href'), feature.path);
    await dockLink.click();
    await page.waitForURL(new URL(feature.path, base).href);
    await page.getByRole('dialog', { name: feature.title, exact: true }).waitFor();
    await checkOpen();
    await page.getByRole('button', { name: 'Close window' }).click();
    await page.waitForURL(home);
  }
  await page.goto(new URL(siteFeatures[0].path, base).href);
  await page.getByRole('dialog', { name: siteFeatures[0].title, exact: true }).waitFor();
  await checkOpen();
  console.log('PASS Settings and all five URL-driven Dock windows');

  await page.setViewportSize({ width: 375, height: 900 });
  await openHome();
  await shortcuts.click();
  await prompt.click();
  await checkOpen(prompt);
  const savedLinks = [
    ['GitHub', 'https://github.com/'], ['YouTube', 'https://www.youtube.com/'],
    ['ChatGPT', 'https://chatgpt.com/'], ['Google', 'https://www.google.com/'], ['Figma', 'https://www.figma.com/'],
  ];
  const shortcutNav = page.getByRole('navigation', { name: 'Frequent shortcuts' });
  for (const [name, href] of savedLinks) {
    const link = shortcutNav.getByRole('link', { name, exact: true });
    assert.equal(await link.getAttribute('href'), href);
    assert.equal(await link.locator('svg').count(), 1, name + ' icon');
  }
  const github = savedLinks[0][1];
  await page.route(github, route => route.fulfill({ body: 'Shortcut navigation fixture' }));
  await shortcutNav.getByRole('link', { name: 'GitHub' }).click();
  await page.waitForURL(github);
  for (const [path, title] of [['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Use'], ['/support', 'Support']]) {
    const response = await page.goto(new URL(path, base).href);
    assert.equal(response.status(), 200);
    await page.getByRole('heading', { name: title, exact: true, level: 1 }).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log('PASS narrow layout: preview switching, original shortcut icons and links, and independent pages');
} finally {
  await browser.close();
}
