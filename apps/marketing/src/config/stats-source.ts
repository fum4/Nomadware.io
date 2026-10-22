import type { S3Credentials } from '@nomadware/site-stats';
import { STATS_R2_ACCESS_KEY_ID, STATS_R2_SECRET_ACCESS_KEY } from 'astro:env/server';

// The R2 read-only credential for the live stats (Vercel env, set by infra/terraform/vercel.tf),
// validated here only. Both set → live; both absent → the bundled snapshot (local dev, or a deploy
// that predates the credential — the page then shows its age honestly); one without the other is
// a misconfiguration and fails loudly.
function readCredentials(): S3Credentials | null {
  const accessKeyId = STATS_R2_ACCESS_KEY_ID ?? '';
  const secretAccessKey = STATS_R2_SECRET_ACCESS_KEY ?? '';
  if (accessKeyId === '' && secretAccessKey === '') return null;
  if (accessKeyId === '' || secretAccessKey === '') {
    throw new Error('STATS_R2_ACCESS_KEY_ID and STATS_R2_SECRET_ACCESS_KEY must be set together');
  }
  return { accessKeyId, secretAccessKey };
}

export const STATS_READ_CREDENTIALS = readCredentials();
