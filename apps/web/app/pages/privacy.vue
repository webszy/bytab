<script setup lang="ts">
import { legalDocuments } from '#shared/site';

definePageMeta({ layout: 'legal' });

const policy = legalDocuments.find(item => item.path === '/privacy')!;
useSiteSeo({ title: policy.seoTitle, description: policy.seoDescription, path: policy.path });

const unpublished = [
  'Legal name of the operator — not yet confirmed',
  'Postal address — not yet confirmed',
  'Contact email — not yet confirmed',
] as const;
</script>

<template>
  <article>
    <h1>Privacy Policy</h1>
    <p class="legal-kicker">Extension version 0.0.1 and the bytab.dev website. This page describes the product as it is built. It is not a representation that bytab meets every requirement of every law.</p>

    <h2>Introduction</h2>
    <p>bytab is a new tab page for Chrome, together with this website. The extension shows the bookmarks already in your browser and gives you a place to open the sites, searches, and AI tools you choose. It does not create a bytab account. The website does not create an account either.</p>
    <p>Two facts are easy to mix together, and this policy keeps them separate. Your Chrome bookmarks are handled on your device and are not uploaded to bytab servers. A prompt you choose to submit can be received by the third-party service you selected. That second step is not an upload to bytab.</p>

    <h2>Information We Access</h2>
    <h3>Chrome bookmarks</h3>
    <p>With the bookmarks permission, the extension reads your Chrome bookmark tree so it can show folders and links and search them in the new tab. It does not create, edit, move, or delete Chrome bookmarks. It does not upload bookmark titles, URLs, or the bookmark tree to bytab servers.</p>
    <h3>Recently closed tabs</h3>
    <p>With the sessions permission, the extension reads recently closed tabs and can show the latest closed tab so you can restore it. That read includes the title and URL Chrome is holding for that session. The extension does not request the history permission and does not read your full browsing history. It does not upload this session data to bytab servers.</p>
    <h3>The last page you open from bytab</h3>
    <p>When you open a bookmark, shortcut, or provider home, the extension stores one record in chrome.storage.local under bytab.lastOpened: a title, an HTTP or HTTPS URL, and a time. When you submit a prompt, that record stores only the homepage of the destination you selected. It does not store the prompt text or the query URL.</p>
    <h3>Shortcuts, layout, and appearance</h3>
    <p>Shortcuts you create, including titles, HTTP or HTTPS URLs, folders, and bar position, are stored in chrome.storage.local under bytab.shortcuts and bytab.shortcutBar. Appearance is stored under bytab.background: theme (light, dark, or system), dock edge (bottom, top, left, or right), glass tint, and whether you use the built-in background or your own image. The selected prompt destination is stored under bytab.promptProvider. These values stay in the browser profile.</p>
    <p>A custom background is processed in the browser and saved in an IndexedDB database named bytab-backgrounds. The extension accepts a JPEG, PNG, or WebP file up to 20 MB and 40 megapixels, scales the longest side to at most 2560 pixels, and stores it as WebP. The image is not uploaded.</p>
    <h3>Prompts you submit</h3>
    <p>Text you type into the prompt bar stays in the page only long enough to take you to the destination you chose. The extension does not send that text to a bytab server and does not write it into extension storage. There is no bytab AI service behind the box. The destination is a third party:</p>
    <ul>
      <li>ChatGPT opens <a href="https://chatgpt.com/?prompt=">chatgpt.com</a> with your text in the <code>prompt</code> parameter.</li>
      <li>Claude opens <a href="https://claude.ai/new?q=">claude.ai</a> with your text in the <code>q</code> parameter.</li>
      <li>Grok opens <a href="https://grok.com/?q=">grok.com</a> with your text in the <code>q</code> parameter.</li>
      <li>Google opens <a href="https://www.google.com/search?q=">google.com/search</a> with your text in the <code>q</code> parameter.</li>
      <li>Bing opens <a href="https://www.bing.com/search?q=">bing.com/search</a> with your text in the <code>q</code> parameter.</li>
      <li>Gemini opens <a href="https://gemini.google.com/app">gemini.google.com/app</a>. If you grant access to that site, the extension places your text in Gemini's composer. If that fill does not succeed, the extension can copy your text to the clipboard and then open Gemini so you can paste it.</li>
    </ul>
    <p>The clipboard action writes your prompt. The extension does not read the clipboard, and it does not request the clipboardRead permission.</p>
    <h3>Gemini page access</h3>
    <p>The extension has the scripting permission and an optional host permission for <code>https://gemini.google.com/*</code>. Chrome asks for that host permission only when you use Gemini. There is no content script that runs on other websites. The injected function looks for Gemini's composer, inserts the prompt you typed, and reports only success or failure. It does not send the contents of the Gemini page to bytab. While doing this, the extension may read the URL of the tab it opened, to confirm the tab is still on gemini.google.com. It does not request the tabs permission and does not keep a log of tabs.</p>
    <h3>This website</h3>
    <p>bytab.dev may store glass appearance values in localStorage under keys beginning with <code>bytab:web:glass:</code>. Those values stay in your browser. The site does not ask for your name, email address, or payment details. Version 0.0.1 has no account form and no payment form. The extension and the website do not exchange your bookmarks.</p>

    <h2>How We Use Information</h2>
    <p>The extension uses the information above to show and search bookmarks, open links you choose, show and restore the latest closed tab, keep shortcuts and appearance on the device, and take a prompt to the destination you select. That is the single purpose of bytab: a bookmark-centered new tab.</p>
    <p>bytab does not sell this information. It does not use it for advertising, retargeting, or interest-based ads. It does not use it to assess creditworthiness or for lending. People operating bytab do not receive your bookmarks, prompts, shortcut list, or session data through the extension, because the extension does not transmit them to bytab servers.</p>

    <h2>Chrome Permissions</h2>
    <p>Version 0.0.1 of the extension requests these permissions:</p>
    <ul>
      <li><strong>bookmarks</strong> — read your bookmark tree for display and on-device search.</li>
      <li><strong>storage</strong> — save the local settings described above in chrome.storage.local. The extension does not use chrome.storage.sync.</li>
      <li><strong>sessions</strong> — read and restore recently closed tabs.</li>
      <li><strong>scripting</strong> — run the Gemini fill function in a Gemini tab the extension opened, only after you allow access to that site.</li>
    </ul>
    <p>The optional host permission is <code>https://gemini.google.com/*</code>. You can refuse it, and you can remove it later in Chrome's extension site-access settings. Without it, bytab cannot insert a prompt into Gemini. The extension does not request history, tabs, cookies, identity, or clipboardRead.</p>

    <h2>Local Storage and Data Retention</h2>
    <p>Data in chrome.storage.local and in the bytab-backgrounds database remains on the device until you change it, clear the extension's data, or uninstall bytab. Uninstalling removes the extension's local storage, including shortcuts, appearance settings, the last-opened record, and a custom background stored by the extension. Uninstalling does not delete your Chrome bookmarks. Those remain in Chrome.</p>
    <p>The last-opened record is a single value. The next page you open from bytab replaces it. Recently closed tabs are read from Chrome when the new tab is shown. bytab does not keep a second history of them.</p>
    <p>Prompt text is not retained by bytab. Because several destinations receive it in the page address, your browser history may keep that address, and the destination may keep the text under its own policy. Website localStorage remains until you clear site data for bytab.dev.</p>

    <h2>Third-Party AI and Search Services</h2>
    <p>bytab does not run an AI model and does not run a web search index. ChatGPT, Claude, Grok, Gemini, Google, and Bing are separate services. Provider icons are packaged in the extension and are not downloaded at runtime. When you submit a prompt, you leave bytab, and the service you chose receives the visit and the text. That service's terms and privacy policy apply. bytab does not control the service, does not receive its reply, and does not see what you do after the tab opens.</p>
    <p>Opening a bookmark or shortcut loads whatever site that link points to. That visit is between you and that site. It is not an upload of your bookmark library to bytab.</p>

    <h2>Data Sharing and Transfers</h2>
    <p>bytab does not share your bookmarks, local settings, shortcut list, or session data with bytab servers. It has no server that receives them. The extension does not include its own network client for that data. The browser does contact other sites when you open them.</p>
    <p>A prompt is transferred only by opening the destination you selected, or by writing the text to your clipboard when Gemini fill does not succeed. A page is transferred by opening the link you selected.</p>
    <p>If Chrome sync is on, Google may sync your bookmarks under your Google account and Chrome settings. That sync is Chrome's. It is separate from bytab, and it is not bytab uploading bookmarks.</p>
    <p>Cloudflare hosts bytab.dev and may process connection data in the regions it uses to serve the site. A third-party AI or search service may process a prompt in its own countries. bytab does not operate its own cross-border transfer of bookmarks, because bookmarks are not sent to bytab.</p>

    <h2>Website Analytics and Technical Logs</h2>
    <p>bytab.dev does not include a third-party analytics product, and its application code does not set analytics cookies. The site does not have a form that submits personal information to bytab.</p>
    <p>The site is hosted on Cloudflare Workers. Cloudflare may process technical data used to deliver and protect the site, such as IP address, user agent, and the requested URL, and may keep operational logs. bytab does not use that technical data to build advertising profiles. This policy does not claim that hosting logs are absent.</p>

    <h2>Data Security</h2>
    <p>Bookmarks and extension settings stay in your browser profile, under Chrome's separation of extension data. Keeping bookmarks off bytab servers avoids a bytab-side copy of that library. No storage method is perfectly secure. A prompt placed in an address can be stored by your browser and by the destination. A custom background is an image in local IndexedDB. This website is served over HTTPS.</p>

    <h2>User Choices and Data Deletion</h2>
    <p>You can make these choices yourself:</p>
    <ul>
      <li>Remove bytab at chrome://extensions. Removal deletes bytab's extension storage. It does not delete Chrome bookmarks.</li>
      <li>Restore the default background in the extension's Appearance settings, which removes the custom image from local image storage.</li>
      <li>Edit or delete shortcuts in the extension.</li>
      <li>Choose another prompt destination, or do not submit a prompt.</li>
      <li>Refuse or remove the optional Gemini site permission. Without it, the extension cannot inject a prompt into Gemini.</li>
      <li>Clear data for bytab.dev in your browser to remove the localStorage preferences.</li>
      <li>Control Chrome sync, bookmarks, and recently closed tabs in Chrome. bytab cannot delete data that Chrome or another website holds on its own.</li>
    </ul>
    <p>There is no bytab account to delete.</p>

    <h2>Children's Privacy</h2>
    <p>bytab is not directed to children under 13. It does not ask for a date of birth and it does not create a profile. It does not knowingly collect personal information from children onto bytab servers. Bookmarks and prompts remain subject to the on-device and third-party handling described above.</p>

    <h2>Chrome Web Store User Data Policy</h2>
    <p>Use of information received through Chrome APIs adheres to the <a href="https://developer.chrome.com/docs/webstore/program-policies/user-data">Chrome Web Store User Data Policy</a>, including the Limited Use requirements:</p>
    <ul>
      <li>Use is limited to providing or improving bytab's single purpose as a bookmark-centered new tab.</li>
      <li>bytab does not sell user data.</li>
      <li>bytab does not use or transfer user data for advertising, including retargeting, personalized advertising, or interest-based advertising.</li>
      <li>bytab does not use or transfer user data to determine creditworthiness or for lending.</li>
      <li>bytab does not allow its personnel to read bookmarks, prompts, or session contents, because that data is not sent to bytab.</li>
      <li>Data reaches a third party when you open a site, a search, or an AI destination; when you allow Gemini access so the prompt can be placed there; when Chrome sync or the host of this website processes data as described above; or when the law requires it.</li>
    </ul>
    <p>A Chrome Web Store listing is not published in this version. If a listing is added later, that listing does not change the handling described here. The store address will be added only when it is a real listing.</p>

    <h2>Changes to This Policy</h2>
    <p>If this policy changes, the new version will be posted at <NuxtLink to="/privacy">bytab.dev/privacy</NuxtLink> with a version note. The extension has no accounts, so bytab cannot email you about a change. This page is the notice. The current companion terms are at <NuxtLink to="/terms">bytab.dev/terms</NuxtLink>.</p>

    <h2>Contact Information</h2>
    <p>This version does not publish a legal entity name, a postal address, or a contact email. Those details are not established in the product, so this page does not invent them. No other name or address on this website should be treated as a company identity or a support inbox for bytab.</p>
    <UnpublishedDetails :items="unpublished" />
    <p>Until this page lists a confirmed contact method, bytab has no separate support address.</p>
  </article>
</template>
