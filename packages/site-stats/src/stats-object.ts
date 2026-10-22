import type { S3Credentials } from './sigv4.ts';
import { signRequest } from './sigv4.ts';

// Where the snapshot lives: R2 bucket `nomadware-io-site-stats` (infra/terraform/r2.tf), EU
// jurisdiction, so the `.eu.` endpoint. The account id is public config (terraform.auto.tfvars).
export const STATS_OBJECT = {
  endpoint: 'https://fbc5bc4bfe835ba7165482b7c8f500ee.eu.r2.cloudflarestorage.com',
  bucket: 'nomadware-io-site-stats',
  key: 'v1/stats.json',
  region: 'auto',
} as const;

const STATS_URL = new URL(`${STATS_OBJECT.endpoint}/${STATS_OBJECT.bucket}/${STATS_OBJECT.key}`);

/** Upload the snapshot JSON (the publisher's write credential). */
export async function putStatsObject(credentials: S3Credentials, json: string): Promise<Response> {
  const extra = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  const headers = await signRequest({
    method: 'PUT',
    url: STATS_URL,
    credentials,
    region: STATS_OBJECT.region,
    body: json,
    headers: extra,
  });
  return fetch(STATS_URL, { method: 'PUT', headers, body: json });
}

/** Fetch the snapshot JSON (the site's read-only credential). */
export async function getStatsObject(
  credentials: S3Credentials,
  signal?: AbortSignal,
): Promise<Response> {
  const headers = await signRequest({
    method: 'GET',
    url: STATS_URL,
    credentials,
    region: STATS_OBJECT.region,
  });
  return fetch(STATS_URL, signal ? { headers, signal } : { headers });
}
