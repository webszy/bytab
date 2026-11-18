<script setup lang="ts">
import { legalDocuments } from '#shared/site';

definePageMeta({ layout: 'legal' });

const terms = legalDocuments.find(item => item.path === '/terms')!;
useSiteSeo({ title: terms.seoTitle, description: terms.seoDescription, path: terms.path });

const unpublished = [
  'Legal name of the operator — not yet confirmed',
  'Postal address — not yet confirmed',
  'Contact email — not yet confirmed',
  'Governing law and dispute venue — not yet confirmed',
] as const;
</script>

<template>
  <article>
    <h1>Terms of Use</h1>
    <p class="legal-kicker">Extension version 0.0.1 and the bytab.dev website. These terms are written for public use. They do not claim to have been cleared for every jurisdiction.</p>

    <h2>Acceptance of Terms</h2>
    <p>These terms apply to the bytab Chrome extension and the website at bytab.dev. By installing the extension or using the website, you agree to these terms and to the <NuxtLink to="/privacy">Privacy Policy</NuxtLink>. If you do not agree, do not install the extension and do not use the site.</p>

    <h2>Description of Service</h2>
    <p>bytab is a new tab for Chrome. It displays your Chrome bookmarks on the device, offers a dock and shortcuts, and can open a web search or take a prompt to a third-party AI or search destination you select. bytab does not operate those destinations. It does not provide its own AI answers or its own search index.</p>
    <p>Version 0.0.1 is free. It does not sell access, and these terms do not add payment, subscription, or refund rules. The extension is intended for Chrome. A Chrome Web Store listing is not published in this version. If one is published later, the listing is another way to install the extension and does not replace these terms.</p>

    <h2>Eligibility and Permitted Use</h2>
    <p>You may use bytab if you are able to agree to these terms. bytab is not directed to children under 13. You may use the extension and the website for your own browsing. You may not misuse them, interfere with them, or use them to harm other people or their systems. The website introduces the product and publishes these documents. It is not a host for your bookmark library.</p>

    <h2>User Responsibilities</h2>
    <p>You are responsible for the bookmarks, shortcuts, backgrounds, and prompts you use with bytab, and for the destinations you open. You are responsible for following the rules of those destinations. Do not submit information to a third-party service if you do not want that service to receive it. A prompt sent in a destination's address, or placed into Gemini, is visible to that destination.</p>
    <p>You are also responsible for the rights in any image you set as a background. The extension stores that image on the device. It does not review it and it does not upload it.</p>

    <h2>Third-Party Services and Websites</h2>
    <p>Bookmarks, shortcuts, and prompt destinations open other websites. In version 0.0.1 the built-in prompt destinations are ChatGPT, Claude, Grok, Gemini, Google, and Bing, plus any site you have saved. Those sites are not operated by bytab. Their content, availability, data practices, and terms are their own. Names and logos are shown so you can recognize a destination. They belong to their owners. An icon or a link is not a statement of partnership or endorsement.</p>
    <p>For Gemini, placing a prompt in the page depends on gemini.google.com and on an optional site permission you can refuse. Other destinations receive the prompt as part of the address the extension opens. bytab does not control whether a destination accepts, displays, or answers that prompt.</p>

    <h2>Intellectual Property</h2>
    <p>The bytab software, the bytab name, and the visual design of the extension and this website belong to their owner. This version does not name that owner as a legal entity. That omission is intentional, and it is not a grant of the name or the design to the public. You receive a personal, revocable, non-exclusive right to use the extension and the website. You do not receive ownership of the software.</p>
    <p>You keep your rights in your own bookmarks, notes, images, and prompts. You may not copy the extension or the site to offer a product that could be confused with bytab, and you may not remove notices that ship with the software. Third-party marks remain the property of their owners.</p>

    <h2>Availability and Changes</h2>
    <p>bytab may change, pause, or stop the extension or the website. Features in version 0.0.1, including which destinations are offered, may change. bytab does not promise that the extension or the website will be available without interruption, or that a future version will keep every current behavior. Chrome, and the sites you open, can also change how a handoff works.</p>

    <h2>Disclaimers</h2>
    <p>The extension and the website are provided as is and as available. To the fullest extent the law allows, warranties of merchantability, fitness for a particular purpose, title, and non-infringement are disclaimed, as is any warranty that the product will be error-free or that a third-party destination will accept or answer a prompt. Search results and AI output come from the service you chose, not from bytab.</p>
    <p>Some places do not allow certain disclaimers. In those places, a disclaimer applies only as far as the law allows. These terms do not say they satisfy the law of any particular place.</p>

    <h2>Limitation of Liability</h2>
    <p>To the fullest extent the law allows, the publisher of bytab is not liable for indirect, incidental, special, consequential, or punitive damages, or for lost data, lost profits, or the acts or omissions of a third-party website or AI service, arising out of your use of the extension or the website. Because version 0.0.1 is free, liability for the service itself is limited to the maximum extent the applicable law allows.</p>
    <p>These terms do not set a currency cap, name a court, or choose a governing law. Those points are not confirmed for this version. Nothing here limits liability that the law does not allow to be limited.</p>

    <h2>Termination</h2>
    <p>You may stop at any time by uninstalling the extension and leaving the website. Uninstalling removes bytab's local extension data, as described in the Privacy Policy, and does not delete your Chrome bookmarks. bytab may stop offering the extension or the website. The sections on intellectual property, disclaimers, and limitation of liability continue after you stop.</p>

    <h2>Updates to Terms</h2>
    <p>Updated terms will be posted at <NuxtLink to="/terms">bytab.dev/terms</NuxtLink> with a version note. If you keep using the extension or the website after the update is posted, you accept the update. If you do not accept it, uninstall the extension and stop using the site. bytab cannot email a notice of the update, because it has no user accounts.</p>

    <h2>Contact Information</h2>
    <p>This version does not publish a legal entity name, a postal address, a contact email, or a governing law. Those details are not established in the product, so these terms do not invent them. No other name or address on this website should be treated as a company identity or a support inbox for bytab.</p>
    <UnpublishedDetails :items="unpublished" />
    <p>Until this page lists a confirmed contact method, bytab has no separate support address. Privacy practices are described in the <NuxtLink to="/privacy">Privacy Policy</NuxtLink>.</p>
  </article>
</template>
