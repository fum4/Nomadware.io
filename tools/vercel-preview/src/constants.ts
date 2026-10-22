/** Same port as `astro dev`, so a preview replaces the dev server's URL rather than adding one. */
export const DEFAULT_PORT = 4321;
export const DEFAULT_HOST = 'localhost';

/** Where `vercel build` writes the Build Output API tree, relative to the app. */
export const OUTPUT_DIR = '.vercel/output';
/** The project link `vercel build` reads its settings from (normally written by `vercel pull`). */
export const PROJECT_FILE = '.vercel/project.json';

/** Content types for the extensions our static output contains; anything else is octet-stream. */
export const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
