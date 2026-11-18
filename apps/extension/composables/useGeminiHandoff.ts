import { onMounted, onBeforeUnmount, ref } from 'vue';
import { browser } from 'wxt/browser';
import { fillGeminiEditor } from '../utils/geminiEditor';

const appUrl = 'https://gemini.google.com/app';
const permission = { origins: ['https://gemini.google.com/*'] };
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function fillTab(tabId: number, prompt: string) {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const tab = await browser.tabs.get(tabId);
    if (tab.status === 'complete' && tab.url !== 'about:blank') {
      if (!tab.url || new URL(tab.url).origin !== new URL(appUrl).origin) return false;
      // The document may disappear or freeze while Chrome is awaiting the injected promise.
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          browser.scripting.executeScript({ target: { tabId }, func: fillGeminiEditor, args: [prompt, deadline] })
            .then(results => results[0]?.result === true),
          new Promise<false>(resolve => { timer = setTimeout(() => resolve(false), Math.max(0, deadline - Date.now())); }),
        ]);
      } finally { clearTimeout(timer); }
    }
    await delay(200);
  }
  return false;
}

export function useGeminiHandoff() {
  const notice = ref<'copied' | 'copy-failed' | 'open-failed' | null>(null);
  const recoveryPrompt = ref('');
  const busy = ref(false);
  let targetId: number | undefined;
  let granted = false;
  let permissionCheck = 0;

  async function refreshPermission() {
    const check = ++permissionCheck;
    const allowed = await browser.permissions.contains(permission).catch(() => false);
    if (permissionCheck === check) granted = allowed;
  }
  onMounted(() => {
    void refreshPermission();
    browser.permissions.onAdded.addListener(refreshPermission);
    browser.permissions.onRemoved.addListener(refreshPermission);
  });
  onBeforeUnmount(() => {
    browser.permissions.onAdded.removeListener(refreshPermission);
    browser.permissions.onRemoved.removeListener(refreshPermission);
  });

  function dismiss() {
    notice.value = null;
    recoveryPrompt.value = '';
    targetId = undefined;
  }

  async function openDestination() {
    try {
      if (targetId === undefined) await browser.tabs.create({ url: appUrl });
      else {
        const target = await browser.tabs.get(targetId);
        const atGemini = target.url && new URL(target.url).origin === new URL(appUrl).origin;
        await browser.tabs.update(targetId, atGemini ? { active: true } : { active: true, url: appUrl });
      }
      dismiss();
    } catch {
      // A closed target can only be replaced by an explicit "Open Gemini" click.
      if (targetId !== undefined && !await browser.tabs.get(targetId).catch(() => undefined)) targetId = undefined;
      notice.value = 'open-failed';
    }
  }

  async function copyThenOpen() {
    try {
      await navigator.clipboard.writeText(recoveryPrompt.value);
    } catch {
      notice.value = 'copy-failed';
      return;
    }
    notice.value = 'copied';
    await delay(1000);
    await openDestination();
  }

  async function recover(copy: boolean) {
    if (busy.value || !notice.value) return;
    busy.value = true;
    try {
      if (copy) await copyThenOpen();
      else await openDestination();
    } finally { busy.value = false; }
  }

  async function tryAutofill(prompt: string) {
    // No await before request: preserve activation from the click or Enter.
    if (!granted && !await browser.permissions.request(permission)) return false;
    const source = await browser.tabs.getCurrent();
    const tab = await browser.tabs.create({ url: appUrl, active: true });
    targetId = tab.id;
    if (targetId !== undefined && await fillTab(targetId, prompt).catch(() => false)) return true;
    // Recovery stays visible even after a cross-origin redirect or permission revocation.
    if (source?.id !== undefined) await browser.tabs.update(source.id, { active: true }).catch(() => {});
    return false;
  }

  async function send(prompt: string) {
    if (busy.value || !prompt.trim()) return;
    busy.value = true;
    dismiss();
    recoveryPrompt.value = prompt;
    try {
      if (await tryAutofill(prompt).catch(() => false)) dismiss();
      else await copyThenOpen();
    } finally { busy.value = false; }
  }

  return { busy, notice, recoveryPrompt, send, recover, dismiss };
}
