import { VERCEL_GIT_COMMIT_SHA } from 'astro:env/server';

import { SHA_LENGTH } from '../constants';

// What "last deploy" in the footer reports. Read once at build time: the site is static, so the
// build is the deploy. Off Vercel there is no commit SHA, so it reads "dev".
export const BUILD_INFO = {
  sha: VERCEL_GIT_COMMIT_SHA ? VERCEL_GIT_COMMIT_SHA.slice(0, SHA_LENGTH) : 'dev',
  builtAt: new Date().toISOString(),
  year: new Date().getFullYear(),
} as const;
