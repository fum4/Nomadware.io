import { VERCEL_GIT_COMMIT_SHA } from 'astro:env/server';

import { SHA_LENGTH } from '../constants';

// The footer's build facts: the © year and the deployed commit (its data-commit, not shown). The
// page renders on demand, so the build time is baked in at build (`import.meta.env.BUILT_AT`,
// astro.config.ts), never read from the clock at request time. Off Vercel there is no commit SHA,
// so it reads "dev".
export const BUILD_INFO = {
  sha: VERCEL_GIT_COMMIT_SHA ? VERCEL_GIT_COMMIT_SHA.slice(0, SHA_LENGTH) : 'dev',
  year: new Date(import.meta.env.BUILT_AT).getUTCFullYear(),
} as const;
