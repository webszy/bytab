<script setup lang="ts">
import { resolveChromeWebStoreUrl, supportPage } from '#shared/site';

definePageMeta({ layout: 'legal' });

useSiteSeo({ title: supportPage.seoTitle, description: supportPage.seoDescription, path: supportPage.path });

const storeUrl = resolveChromeWebStoreUrl(useRuntimeConfig().public.chromeWebStoreUrl);
const supportEmail = 'szyszylife@gmail.com';
const supportHref = `mailto:${supportEmail}?subject=${encodeURIComponent('bytab Support — ')}`;
</script>

<template>
  <article>
    <h1>{{ supportPage.title }}</h1>
    <p>Need help with bytab? We're here to help.</p>

    <section aria-labelledby="getting-started">
      <h2 id="getting-started">Getting Started</h2>
      <h3>How do I start using bytab?</h3>
      <p>
        Install bytab from the
        <a v-if="storeUrl" :href="storeUrl" target="_blank" rel="noopener noreferrer">Chrome Web Store</a>
        <template v-else>Chrome Web Store</template>.
        Once enabled, open a new tab to access your bookmarks, shortcuts, and personalized space.
      </p>
      <h3>How do I access my Chrome bookmarks?</h3>
      <p>bytab reads your existing Chrome bookmarks and displays them in your new tab. You don't need to import or upload anything.</p>
      <h3>How do I search my bookmarks?</h3>
      <p>Use the bookmark search in the extension to quickly find pages you've already saved.</p>
    </section>

    <section aria-labelledby="frequently-asked-questions">
      <h2 id="frequently-asked-questions">Frequently Asked Questions</h2>
      <h3>Is bytab free?</h3>
      <p>Yes. bytab v0.0.1 is free to use.</p>
      <h3>Does bytab upload my bookmarks?</h3>
      <p>No. Your Chrome bookmarks are processed locally and are not uploaded to bytab servers.</p>
      <h3>Does bytab work without an account?</h3>
      <p>Yes. You don't need to create an account to use bytab.</p>
      <h3>Can I customize my new tab?</h3>
      <p>Yes. You can adjust supported appearance settings and use your own background image.</p>
      <h3>Does bytab provide its own AI service?</h3>
      <p>No. bytab helps you open supported third-party AI services. Those services operate independently and have their own terms and privacy policies.</p>
      <h3>How do I uninstall bytab?</h3>
      <p>Open Chrome's Extensions management page, locate bytab, and select Remove. Your existing Chrome bookmarks will remain in Chrome.</p>
      <h3>Does bytab work in other browsers?</h3>
      <p>The initial release is designed for Google Chrome.</p>
    </section>

    <section aria-labelledby="contact-support">
      <h2 id="contact-support">Still need help?</h2>
      <p>If you have a question, found a bug, or want to share feedback, feel free to get in touch.</p>
      <p><a class="support-contact" :href="supportHref">Contact Support</a> <span>{{ supportEmail }}</span></p>
    </section>
  </article>
</template>

<style scoped>
.support-contact {
  display: inline-block;
  margin: 0 8px 6px 0;
  padding: 7px 12px;
  border: 1px solid currentColor;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
}
</style>
