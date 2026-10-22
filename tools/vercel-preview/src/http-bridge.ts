// Node's http request/response <-> the Fetch API Request/Response that Vercel's Node launcher
// hands a function's `fetch` export (and that the external-rewrite proxy forwards).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { pipeline } from 'node:stream/promises';

export function toRequest(req: IncomingMessage, origin: string): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) headers.append(name, item);
  }
  // Vercel's edge sets these; the contact endpoint's rate limiter keys on the client address.
  headers.set('x-forwarded-for', req.socket.remoteAddress ?? '');
  headers.set('x-forwarded-proto', 'http');
  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  return new Request(new URL(req.url ?? '/', origin), {
    method,
    headers,
    ...(hasBody ? { body: Readable.toWeb(req) as ReadableStream, duplex: 'half' } : {}),
  });
}

// fetch() has already decoded the body, so the upstream's encoding/length no longer apply.
const DROPPED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
]);

export async function sendResponse(
  res: ServerResponse,
  response: Response,
  extraHeaders: Record<string, string>,
): Promise<void> {
  res.statusCode = response.status;
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  response.headers.forEach((value, name) => {
    if (name !== 'set-cookie' && !DROPPED_RESPONSE_HEADERS.has(name)) res.setHeader(name, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) res.setHeader('set-cookie', cookies);
  if (!response.body) {
    res.end();
    return;
  }
  await pipeline(Readable.fromWeb(response.body as NodeReadableStream), res);
}
