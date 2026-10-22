import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { defineConfig, envField, fontProviders } from 'astro/config';

// Static by default: every page is prerendered. Later on-demand routes (live stats, the contact
// endpoint) opt out per route with `export const prerender = false`.
export default defineConfig({
  site: 'https://nomadware.io',
  adapter: vercel(),
  integrations: [sitemap()],
  // One small stylesheet: inlining it removes the only render-blocking request.
  build: { inlineStylesheets: 'always' },
  env: {
    schema: {
      // Vercel system env, present on Vercel builds only; build-info falls back to "dev" locally.
      VERCEL_GIT_COMMIT_SHA: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
    },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-geist',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: ['@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
});
