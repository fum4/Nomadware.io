// Serves a loaded Build Output tree: each request is routed by `resolve` (routes.ts), then answered
// from static/, by an in-process function, or by proxying an external rewrite.
import { createReadStream } from 'node:fs';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { CONTENT_TYPES } from './constants.ts';
import { sendResponse, toRequest } from './http-bridge.ts';
import type { LoadedOutput } from './output.ts';
import { resolve } from './routes.ts';

// Hop-by-hop or origin-bound: the upstream must see its own host, not ours.
const DROPPED_PROXY_HEADERS = ['host', 'connection', 'x-forwarded-for', 'x-forwarded-proto'];

async function serveFile(res: ServerResponse, output: LoadedOutput, path: string): Promise<void> {
  res.setHeader('content-type', CONTENT_TYPES[extname(path)] ?? 'application/octet-stream');
  await pipeline(createReadStream(join(output.staticDir, path)), res);
}

async function proxy(request: Request, url: string): Promise<Response> {
  const headers = new Headers(request.headers);
  for (const name of DROPPED_PROXY_HEADERS) headers.delete(name);
  return fetch(url, {
    method: request.method,
    headers,
    redirect: 'manual',
    ...(request.body ? { body: request.body, duplex: 'half' } : {}),
  });
}

export function createPreviewServer(output: LoadedOutput, origin: string): Server {
  return createServer((req, res) => {
    const request = toRequest(req, origin);
    const url = new URL(request.url);
    const route = resolve(output.phases, url.pathname, url.search, output);
    void (async () => {
      switch (route.kind) {
        case 'file':
          res.statusCode = route.status;
          for (const [name, value] of Object.entries(route.headers)) res.setHeader(name, value);
          return serveFile(res, output, route.path);
        case 'function': {
          const handler = output.functions.get(route.name);
          if (!handler) throw new Error(`function ${route.name} vanished`);
          // Vercel invokes the function with the original URL, not the rewritten path.
          return sendResponse(res, await handler(request), route.headers);
        }
        case 'proxy':
          return sendResponse(res, await proxy(request, route.url), route.headers);
        case 'status':
          return sendResponse(res, new Response(null, { status: route.status }), route.headers);
      }
    })().catch((error: unknown) => {
      process.stderr.write(`vercel-preview: ${req.method} ${req.url} failed: ${String(error)}\n`);
      if (!res.headersSent) res.statusCode = 500;
      res.end();
    });
  });
}
