// Chrome serializes this function into the target tab. Keep all DOM logic self-contained.
export async function fillGeminiEditor(prompt: string, deadline: number): Promise<boolean> {
  const inComposer = () => location.origin === 'https://gemini.google.com'
    && /^\/app\/?$/.test(location.pathname);
  const findEditor = () => {
    // Gemini's rich-textarea also contains Quill's offscreen clipboard element.
    const matches = document.querySelectorAll<HTMLElement>(
      'rich-textarea [role="textbox"][contenteditable="true"], rich-textarea textarea',
    );
    return [...matches].find(element => element.getClientRects().length
      && getComputedStyle(element).visibility === 'visible' && !element.closest('[inert], [aria-hidden="true"]')
      && element.getAttribute('aria-disabled') !== 'true');
  };

  function insert(editor: HTMLElement) {
    if (editor instanceof HTMLTextAreaElement) {
      if (editor.disabled || editor.readOnly || editor.value) return false;
      editor.focus();
      editor.setRangeText(prompt, 0, 0, 'end');
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: prompt }));
      return editor.value === prompt;
    }
    if (!editor.isContentEditable || editor.textContent || editor.querySelector('img, video, [contenteditable="false"]')) return false;
    editor.focus();
    if (document.activeElement !== editor) return false;
    // Native plain-text editing fires input and lets Quill update its own document.
    if (!document.execCommand('insertText', false, prompt)) return false;
    if (editor.innerText === prompt) return true;
    // Quill uses a paragraph per line. Native contenteditables may put the first
    // line in a text node and wrap subsequent lines. <br> marks an empty line.
    const nodes = [...editor.childNodes];
    const lines = nodes.map(node => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node instanceof HTMLElement && node.matches('p, div')) {
        return node.innerText.replace(/^\n$/, '');
      }
      return null;
    });
    return lines.every(line => line !== null) && lines.join('\n') === prompt;
  }

  return new Promise(resolve => {
    function finish(result: boolean) {
      observer.disconnect();
      clearTimeout(timer);
      resolve(result);
    }
    function check() {
      if (!inComposer() || Date.now() >= deadline) return finish(false);
      const editor = findEditor();
      if (editor) {
        observer.disconnect();
        try { finish(insert(editor)); } catch { finish(false); }
      }
    }
    const observer = new MutationObserver(check);
    const timer = setTimeout(() => finish(false), Math.max(0, deadline - Date.now()));
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['contenteditable', 'role', 'class', 'style', 'aria-hidden', 'disabled'] });
    check();
  });
}
