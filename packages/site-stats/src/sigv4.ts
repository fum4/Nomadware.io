// AWS Signature V4 for one S3-API request (R2 speaks it). Hand-written, not a dependency: the
// publisher runs on bare Node with no install step, and we only ever sign a single-object GET/PUT.
// Correctness is pinned by AWS's published S3 examples (sigv4.test.ts). WebCrypto only, so the
// same code runs in Node and in Vercel's runtime.

export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export interface SignInput {
  method: 'GET' | 'PUT';
  url: URL;
  credentials: S3Credentials;
  /** S3 region; R2 uses "auto". */
  region: string;
  body?: string;
  /** Extra headers to send and sign (names any case). */
  headers?: Readonly<Record<string, string>>;
  now?: Date;
}

const ALGORITHM = 'AWS4-HMAC-SHA256';
const SERVICE = 's3';
const encoder = new TextEncoder();

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(data)));
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
}

/** RFC 3986 encoding, as SigV4 wants it (encodeURIComponent leaves !'()* alone). */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Each path segment encoded exactly once (S3 does not double-encode). */
function canonicalPath(url: URL): string {
  return url.pathname
    .split('/')
    .map((segment) => encodeRfc3986(decodeURIComponent(segment)))
    .join('/');
}

function canonicalQuery(url: URL): string {
  return [...url.searchParams]
    .map(([name, value]) => `${encodeRfc3986(name)}=${encodeRfc3986(value)}`)
    .toSorted()
    .join('&');
}

/** The headers to send, Authorization included. */
export async function signRequest(input: SignInput): Promise<Record<string, string>> {
  const now = input.now ?? new Date();
  const amzDate = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(input.body ?? '');

  const headers: Record<string, string> = {
    host: input.url.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  for (const [name, value] of Object.entries(input.headers ?? {})) {
    headers[name.toLowerCase()] = value.trim();
  }
  const names = Object.keys(headers).toSorted();
  const signedHeaders = names.join(';');
  const canonicalHeaders = names.map((name) => `${name}:${headers[name] ?? ''}\n`).join('');

  const canonicalRequest = [
    input.method,
    canonicalPath(input.url),
    canonicalQuery(input.url),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const scope = `${dateStamp}/${input.region}/${SERVICE}/aws4_request`;
  const stringToSign = [ALGORITHM, amzDate, scope, await sha256Hex(canonicalRequest)].join('\n');

  const dateKey = await hmac(encoder.encode(`AWS4${input.credentials.secretAccessKey}`), dateStamp);
  const regionKey = await hmac(dateKey, input.region);
  const serviceKey = await hmac(regionKey, SERVICE);
  const signingKey = await hmac(serviceKey, 'aws4_request');
  const signature = toHex(await hmac(signingKey, stringToSign));

  const { host: _host, ...sent } = headers;
  return {
    ...sent,
    authorization: `${ALGORITHM} Credential=${input.credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
