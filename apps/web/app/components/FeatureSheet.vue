<script setup lang="ts">
import type { FeatureContent } from '#shared/feature-content';
import type { SiteFeature } from '#shared/site';

defineProps<{ feature: SiteFeature; content: FeatureContent }>();
</script>

<template>
  <article class="feature-sheet">
    <header class="feature-hero">
      <span class="feature-hero-mark">
        <SiteIcon :name="feature.icon" />
      </span>
      <div class="feature-hero-copy">
        <h3>{{ content.heroTitle }}</h3>
        <p>{{ content.heroSubtitle }}</p>
      </div>
    </header>
    <ol class="feature-modules">
      <li v-for="module in content.modules" :key="module.title">
        <span class="feature-module-mark">
          <FeatureGlyph :name="module.icon" />
        </span>
        <h4>{{ module.title }}</h4>
        <p>{{ module.description }}</p>
      </li>
    </ol>
    <footer class="feature-sheet-foot">
      <ul class="feature-intro-tags">
        <li v-for="tag in content.tags" :key="tag">{{ tag }}</li>
      </ul>
      <div v-if="content.links?.length" class="feature-sheet-links">
        <p v-if="content.linksLabel" class="feature-sheet-links-label">{{ content.linksLabel }}</p>
        <nav :aria-label="content.linksLabel || 'Policies'">
          <NuxtLink
            v-for="(link, index) in content.links"
            :key="link.to"
            :to="link.to"
            class="feature-link"
            :class="content.linksTone === 'emphasis' && index === 0 ? 'feature-link--primary' : 'feature-link--secondary'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </footer>
  </article>
</template>

<style scoped>
.feature-sheet {
  container-type: inline-size;
  display: flex;
  box-sizing: border-box;
  min-height: min(520px, calc(100dvh - var(--dock-height) - 140px));
  flex-direction: column;
  padding: 44px 52px 36px;
  background:
    radial-gradient(78% 52% at 0% 0%, rgb(186 214 255 / 28%), transparent 62%),
    radial-gradient(60% 48% at 100% 100%, rgb(255 214 226 / 24%), transparent 58%);
}

:global([data-theme='dark'] .feature-sheet) {
  background:
    radial-gradient(78% 52% at 0% 0%, rgb(85 116 176 / 24%), transparent 62%),
    radial-gradient(60% 48% at 100% 100%, rgb(154 84 127 / 18%), transparent 58%);
}

.feature-hero {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.feature-hero-mark,
.feature-module-mark {
  display: grid;
  flex: none;
  place-items: center;
  color: #0071e3;
}

.feature-hero-mark {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(0 113 227 / 14%), rgb(0 113 227 / 6%));
  box-shadow: inset 0 0 0 1px rgb(0 113 227 / 16%);
}

.feature-module-mark {
  width: 32px;
  height: 32px;
  margin-bottom: 14px;
  border-radius: 10px;
  background: rgb(0 113 227 / 8%);
}

:global([data-theme='dark'] .feature-hero-mark),
:global([data-theme='dark'] .feature-module-mark) {
  color: #9cc7ff;
  background: rgb(143 196 255 / 14%);
  box-shadow: inset 0 0 0 1px rgb(143 196 255 / 22%);
}

.feature-hero-mark :deep(.home-icon) { width: 24px; height: 24px; }
.feature-module-mark :deep(.home-icon) { width: 16px; height: 16px; }

.feature-hero-copy { min-width: 0; padding-top: 2px; }

.feature-hero h3 {
  margin: 0;
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.12;
}

.feature-hero p {
  max-width: 34rem;
  margin: 10px 0 0;
  color: color-mix(in srgb, currentColor 68%, transparent);
  font-size: 16px;
  line-height: 1.5;
}

.feature-modules {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 36px 0 0;
  padding: 0;
  list-style: none;
}

.feature-modules li {
  min-width: 0;
  padding: 18px 16px 16px;
  border: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--window-surface) 62%, transparent);
}

.feature-modules h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.feature-modules p {
  margin: 8px 0 0;
  color: color-mix(in srgb, currentColor 68%, transparent);
  font-size: 13px;
  line-height: 1.5;
}

.feature-sheet-foot { margin-top: auto; padding-top: 32px; }

.feature-sheet-foot .feature-intro-tags { margin: 0; }

.feature-sheet-links { margin-top: 22px; }

.feature-sheet-links-label {
  margin: 0 0 10px;
  color: color-mix(in srgb, currentColor 58%, transparent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.feature-sheet-links nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.feature-link {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.feature-link:focus-visible {
  outline: 2px solid var(--window-focus);
  outline-offset: 3px;
}

.feature-link--primary {
  background: #0071e3;
  color: #fff;
}

.feature-link--secondary {
  border-color: color-mix(in srgb, currentColor 14%, transparent);
  background: color-mix(in srgb, var(--window-surface) 72%, transparent);
  color: inherit;
}

.feature-link--primary:hover { background: #0066cc; }
.feature-link--secondary:hover { background: color-mix(in srgb, var(--window-ink) 6%, var(--window-surface)); }

@container (max-width: 680px) {
  .feature-sheet { padding: 28px 22px 24px; }
  .feature-hero { gap: 14px; }
  .feature-hero-mark { width: 44px; height: 44px; border-radius: 14px; }
  .feature-modules { grid-template-columns: 1fr; margin-top: 28px; }
}

@media (prefers-reduced-transparency: reduce) {
  .feature-sheet,
  .feature-modules li,
  .feature-link--secondary {
    background: var(--window-surface);
  }
}
</style>
