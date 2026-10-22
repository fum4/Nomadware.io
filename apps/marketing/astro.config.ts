import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { defineConfig, envField, fontProviders } from 'astro/config';

// Static by default: every page is prerendered. On-demand routes (the contact endpoint, later
// live stats) opt out per route with `export const prerender = false`.
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
      // Contact form (read only in src/config/contact.ts). Vercel: infra/terraform/vercel.tf.
      // Locally: apps/marketing/.env, rendered from infra/env/marketing.dev.env.
      // Public site key: required, so a build without it fails instead of shipping a dead form.
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      // Server values: optional to Astro so the endpoint can answer `unconfigured` (and log the
      // missing names) instead of crashing; src/config/contact.ts refuses to run without them.
      TURNSTILE_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_HOSTNAME: envField.string({ context: 'server', access: 'public', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
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
