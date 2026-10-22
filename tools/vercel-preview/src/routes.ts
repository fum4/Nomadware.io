// Vercel's routing for a Build Output API v3 `config.json`, the subset `vercel build` emits for our
// apps: header/redirect routes, `handle: filesystem` and `handle: error` phases, rewrites to a path,
// a function or an external URL. A route using anything else fails at load (`parseRoutes`) rather
// than being served differently from Vercel. Spec: https://vercel.com/docs/build-output-api/v3/configuration#routes

export type Route = {
  src: string;
  dest?: string;
  headers?: Record<string, string>;
  status?: number;
  continue?: boolean;
  check?: boolean;
};

type Handle = { handle: string };

/** Routes grouped by the `handle` phase that precedes them (`main` = before any handle). */
export type Phases = ReadonlyMap<string, readonly Route[]>;

/** What exists in the output: `static/` files (by URL path) and `functions/<name>.func`. */
export type Output = {
  hasFile: (path: string) => boolean;
  hasFunction: (name: string) => boolean;
};

export type Resolution = { headers: Record<string, string> } & (
  | { kind: 'file'; path: string; status: number }
  | { kind: 'function'; name: string }
  | { kind: 'proxy'; url: string }
  | { kind: 'status'; status: number }
);

const ROUTE_KEYS = new Set(['src', 'dest', 'headers', 'status', 'continue', 'check']);
const PHASES = new Set(['filesystem', 'error']);

export function parseRoutes(routes: readonly (Route | Handle)[]): Phases {
  const phases = new Map<string, Route[]>([['main', []]]);
  let current = 'main';
  for (const route of routes) {
    if ('handle' in route) {
      if (!PHASES.has(route.handle)) throw new Error(`unsupported handle: ${route.handle}`);
      current = route.handle;
      phases.set(current, []);
      continue;
    }
    const unknown = Object.keys(route).filter((key) => !ROUTE_KEYS.has(key));
    if (unknown.length > 0) throw new Error(`unsupported route key(s) ${unknown.join(', ')}`);
    phases.get(current)?.push(route);
  }
  return phases;
}

function isExternal(dest: string): boolean {
  return /^https?:\/\//.test(dest);
}

/** `$1` / `$name` in `dest` and header values, from the `src` match. */
function substitute(template: string, match: RegExpExecArray): string {
  return template.replace(/\$(\d+|[a-zA-Z_]\w*)/g, (_, key: string) => {
    const value = /^\d+$/.test(key) ? match[Number(key)] : match.groups?.[key];
    return value ?? '';
  });
}

// Vercel matches `src` case-insensitively unless a route sets `caseSensitive`.
function matchRoute(route: Route, path: string): RegExpExecArray | null {
  return new RegExp(route.src, 'i').exec(path);
}

function findTarget(path: string, output: Output, headers: Record<string, string>) {
  const file = path.endsWith('/') ? `${path}index.html` : path;
  if (output.hasFile(file)) return { kind: 'file', path: file, status: 200, headers } as const;
  if (output.hasFile(`${path}/index.html`)) {
    return { kind: 'file', path: `${path}/index.html`, status: 200, headers } as const;
  }
  const name = path.replace(/^\//, '');
  if (output.hasFunction(name)) return { kind: 'function', name, headers } as const;
  return null;
}

/** Resolves a request path the way Vercel's edge would against the same `config.json`. */
export function resolve(
  phases: Phases,
  pathname: string,
  search: string,
  output: Output,
): Resolution {
  const headers: Record<string, string> = {};
  let path = pathname;

  for (const route of phases.get('main') ?? []) {
    const match = matchRoute(route, path);
    if (!match) continue;
    for (const [name, value] of Object.entries(route.headers ?? {})) {
      headers[name.toLowerCase()] = substitute(value, match);
    }
    if (route.dest !== undefined) {
      const dest = substitute(route.dest, match);
      if (isExternal(dest)) return { kind: 'proxy', url: withSearch(dest, search), headers };
      path = dest.startsWith('/') ? dest : `/${dest}`;
    } else if (route.status !== undefined) {
      return { kind: 'status', status: route.status, headers };
    }
    if (!route.continue) break;
  }

  const direct = findTarget(path, output, headers);
  if (direct) return direct;

  for (const route of phases.get('filesystem') ?? []) {
    const match = matchRoute(route, path);
    if (!match || route.dest === undefined) continue;
    const dest = substitute(route.dest, match);
    if (isExternal(dest)) return { kind: 'proxy', url: withSearch(dest, search), headers };
    const target = findTarget(dest.startsWith('/') ? dest : `/${dest}`, output, headers);
    if (target) return target;
    if (!route.check) break;
  }

  for (const route of phases.get('error') ?? []) {
    if (!matchRoute(route, pathname) || route.dest === undefined) continue;
    if (output.hasFile(route.dest)) {
      return { kind: 'file', path: route.dest, status: route.status ?? 404, headers };
    }
  }
  return { kind: 'status', status: 404, headers };
}

function withSearch(url: string, search: string): string {
  return search && !url.includes('?') ? `${url}${search}` : url;
}
