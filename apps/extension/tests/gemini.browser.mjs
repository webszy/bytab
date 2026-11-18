import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.BYTAB_PLAYWRIGHT_MODULE || 'playwright');
const live = process.argv.includes('--live');
const url = 'https://gemini.google.com/app';
const origin = 'https://gemini.google.com/*';
const prompt = 'Hello Gemini，中文 & <test> 😀\n\nSecond line!';
const tmp = await mkdtemp(path.join(os.tmpdir(), 'bytab-gemini-'));
let context;
try {
  // Pre-grant the optional origin in a temporary copy so real executeScript runs in
  // headless Chromium. The native Allow / Deny dialog itself requires manual QA.
  const extension = path.join(tmp, 'extension');
  await cp(fileURLToPath(new URL('../dist/chrome-mv3', import.meta.url)), extension, { recursive: true });
  const manifestFile = path.join(extension, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  assert.deepEqual(manifest.optional_host_permissions, [origin]);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.permissions.sort(), ['bookmarks', 'scripting', 'sessions', 'storage']);
  manifest.host_permissions = manifest.optional_host_permissions;
  delete manifest.optional_host_permissions;
  await writeFile(manifestFile, JSON.stringify(manifest));

  context = await chromium.launchPersistentContext(path.join(tmp, 'profile'), {
    ...(process.env.BYTAB_CHROMIUM_EXECUTABLE ? { executablePath: process.env.BYTAB_CHROMIUM_EXECUTABLE } : { channel: 'chromium' }),
    headless: true, ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  let fixture = 'editor';
  if (!live) {
    await context.route('https://**/*', route => {
      const body = fixture === 'editor' ? `<script>setTimeout(() => {
        document.body.innerHTML = '<rich-textarea><div contenteditable="true" role="textbox"></div></rich-textarea>';
        document.addEventListener('input', () => document.body.dataset.input = 'yes');
      }, 350)</script>` : '<main>Waiting for editor</main>';
      return route.fulfill({ contentType: 'text/html', body });
    });
    await context.exposeBinding('loadFixture', async ({ page }, targetUrl) => {
      assert.equal(targetUrl, url);
      const target = context.pages().find(other => other !== page) ?? await context.waitForEvent('page');
      await target.goto(fixture === 'redirect' ? 'https://accounts.google.com/' : targetUrl);
    });
    await context.addInitScript(() => {
      if (!globalThis.chrome?.tabs?.create) return;
      const state = window.geminiTest = { allow: true, failCopy: false, requests: [], copies: [], targets: [] };
      chrome.permissions.contains = async () => sessionStorage.getItem('granted') === 'yes';
      chrome.permissions.request = async ({ origins }) => {
        state.requests.push({ origins, activation: navigator.userActivation.isActive });
        return state.allow;
      };
      Object.defineProperty(navigator.clipboard, 'writeText', { value: async text => {
        if (state.failCopy) throw new DOMException('Clipboard unavailable', 'NotAllowedError');
        state.copies.push(text);
      } });
      const create = chrome.tabs.create.bind(chrome.tabs);
      chrome.tabs.create = async options => {
        state.targets.push(options.url);
        const tab = await create({ ...options, url: 'about:blank' });
        // Attach routing before the first external navigation in this disposable tab.
        await window.loadFixture(options.url);
        return tab;
      };
    });
  }

  const page = context.pages()[0] ?? await context.newPage();
  await page.goto('chrome://newtab/');
  const input = page.locator('#home-prompt-input');
  const submit = page.locator('.prompt-send');
  await page.getByRole('button', { name: 'Select provider' }).click();
  await page.locator('[data-provider="gemini"]').click();
  await input.fill(prompt);

  async function submitAndCheckEditor(click) {
    const next = context.waitForEvent('page');
    if (click) await submit.click();
    else await input.press('Enter');
    const target = await next;
    const editor = target.locator('rich-textarea [contenteditable="true"][role="textbox"]');
    await target.waitForFunction(() => document.querySelector('rich-textarea [role="textbox"]')?.textContent.includes('Second line!'), null, { timeout: 35000 });
    await page.waitForFunction(() => !document.querySelector('.prompt-send').disabled);
    assert.equal(target.url(), url);
    assert.equal(await editor.evaluate(el => document.activeElement === el), true);
    assert.equal(await editor.locator('test').count(), 0);
    assert.ok(await editor.evaluate((el, text) => el.innerText === text ||
      [...el.childNodes].map(child => child.nodeType === 3 ? child.textContent : child.innerText.replace(/^\n$/, '')).join('\n') === text, prompt));
    if (!live) assert.equal(await target.locator('body').getAttribute('data-input'), 'yes');
    assert.equal(await page.locator('.handoff-toast').count(), 0);
    assert.equal(context.pages().length, 2);
    assert.ok(!JSON.stringify(await page.evaluate(() => chrome.storage.local.get(null))).includes('Second line!'));
    await target.close();
  }
  await submitAndCheckEditor(false);
  if (live) {
    console.log('PASS live Gemini composer received exact multiline plain text and focus, without submission (pre-granted test profile)');
  } else {
    assert.deepEqual(await page.evaluate(() => geminiTest.requests), [{ origins: [origin], activation: true }]);
    console.log('PASS first grant through Enter with active gesture, delayed editor and one tab');
    await page.evaluate(() => sessionStorage.setItem('granted', 'yes'));
    await page.reload();
    await input.fill(prompt);
    await submitAndCheckEditor(true);
    assert.deepEqual(await page.evaluate(() => geminiTest.requests), []);
    console.log('PASS pre-granted through blue button with no permission request');

    await page.evaluate(() => sessionStorage.removeItem('granted'));
    await page.reload();
    await input.fill(prompt);
    await page.evaluate(() => { geminiTest.allow = false; });
    await submit.click();
    const copied = page.getByText('Prompt copied!', { exact: false });
    await copied.waitFor();
    assert.ok(await page.getByText('Paste it into Gemini to continue.').isVisible());
    assert.deepEqual(await page.evaluate(() => geminiTest.targets), []);
    assert.deepEqual(await page.evaluate(() => geminiTest.copies), [prompt]);
    const deniedTarget = await context.waitForEvent('page');
    await page.waitForFunction(() => !document.querySelector('.prompt-send').disabled);
    await deniedTarget.close();
    assert.deepEqual(await page.evaluate(() => geminiTest.requests), [{ origins: [origin], activation: true }]);
    console.log('PASS refusal copies before toast and subsequent open, no second permission request');

    await page.evaluate(() => { geminiTest.failCopy = true; });
    await input.press('Enter');
    const failed = page.getByText("Couldn't copy prompt", { exact: true });
    await failed.waitFor();
    assert.equal(await input.inputValue(), prompt);
    assert.equal(context.pages().length, 1);
    assert.equal(await copied.count(), 0);
    await page.evaluate(() => { geminiTest.failCopy = false; });
    const retryTab = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Copy Prompt' }).click();
    await copied.waitFor();
    const recovered = await retryTab;
    await page.waitForFunction(() => !document.querySelector('.prompt-send').disabled);
    await recovered.close();
    console.log('PASS clipboard rejection preserves original and manual Copy Prompt recovers');

    for (const mode of ['no-editor', 'redirect', 'revoked']) {
      fixture = mode;
      await page.evaluate(mode => {
        geminiTest.allow = true;
        geminiTest.failCopy = mode !== 'redirect';
        if (mode === 'revoked') chrome.scripting.executeScript = async () => { throw new Error('Host access revoked'); };
      }, mode);
      const before = await page.evaluate(() => geminiTest.targets.length);
      const next = context.waitForEvent('page');
      await submit.click();
      const target = await next;
      if (mode === 'redirect') {
        await copied.waitFor();
        await page.waitForFunction(() => !document.querySelector('.prompt-send').disabled);
      } else {
        await failed.waitFor({ timeout: 35000 });
        assert.equal(await page.evaluate(() => document.visibilityState), 'visible');
        assert.equal(await page.getByRole('textbox', { name: 'Prompt to copy' }).inputValue(), prompt);
        await page.getByRole('button', { name: 'Open Gemini' }).click();
        await page.waitForFunction(() => !document.querySelector('.prompt-send').disabled);
      }
      assert.equal(await page.evaluate(() => geminiTest.targets.length), before + 1);
      assert.equal(context.pages().length, 2);
      await target.close();
      console.log(`PASS ${mode} visible recovery reuses the original target`);
    }
  }
} finally {
  await context?.close();
  await rm(tmp, { recursive: true, force: true });
}
