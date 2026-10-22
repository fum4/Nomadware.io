// Loads a Build Output API v3 tree: routes from config.json, the static/ file list, and each
// functions/<name>.func imported in-process through its .vc-config.json handler.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseRoutes, type Output, type Phases } from './routes.ts';

type FetchHandler = (request: Request) => Promise<Response>;

export type LoadedOutput = Output & {
  phases: Phases;
  staticDir: string;
  functions: ReadonlyMap<string, FetchHandler>;
};

type FunctionConfig = { handler?: string; launcherType?: string };

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries.map((entry) => join(entry.parentPath, entry.name));
}

function urlPath(root: string, file: string): string {
  return `/${relative(root, file).split(sep).join('/')}`;
}

async function loadFunction(funcDir: string): Promise<FetchHandler> {
  const config = JSON.parse(
    await readFile(join(funcDir, '.vc-config.json'), 'utf8'),
  ) as FunctionConfig;
  if (config.launcherType !== 'Nodejs' || !config.handler) {
    throw new Error(`${funcDir}: only Node.js functions are supported (launcherType Nodejs)`);
  }
  const module = (await import(pathToFileURL(join(funcDir, config.handler)).href)) as {
    default?: { fetch?: FetchHandler };
  };
  const fetch = module.default?.fetch;
  if (typeof fetch !== 'function') {
    throw new Error(`${funcDir}: handler must default-export { fetch(request) }`);
  }
  return (request) => fetch(request);
}

export async function loadOutput(outputDir: string): Promise<LoadedOutput> {
  const config = JSON.parse(await readFile(join(outputDir, 'config.json'), 'utf8')) as {
    routes?: Parameters<typeof parseRoutes>[0];
  };
  const staticDir = join(outputDir, 'static');
  const files = new Set((await walk(staticDir)).map((file) => urlPath(staticDir, file)));

  const functionsDir = join(outputDir, 'functions');
  const funcDirs = (await walk(functionsDir)).filter((path) => path.endsWith('.func'));
  const functions = new Map<string, FetchHandler>(
    await Promise.all(
      funcDirs.map(
        async (path) =>
          [
            urlPath(functionsDir, path).slice(1, -'.func'.length),
            await loadFunction(path),
          ] as const,
      ),
    ),
  );

  return {
    phases: parseRoutes(config.routes ?? []),
    staticDir,
    functions,
    hasFile: (path) => files.has(path),
    hasFunction: (name) => functions.has(name),
  };
}
