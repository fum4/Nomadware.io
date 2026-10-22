// node tools/vercel-preview/src/main.ts --framework <slug>, from an app's directory:
// `vercel build --prod` (Vercel's own build, vercel.json merged into the output), then serve
// .vercel/output locally. README.md explains the choice and the limits.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { DEFAULT_HOST, DEFAULT_PORT, OUTPUT_DIR, PROJECT_FILE } from './constants.ts';
import { loadOutput } from './output.ts';
import { createPreviewServer } from './server.ts';

const { values } = parseArgs({ options: { framework: { type: 'string' } } });
if (!values.framework) throw new Error('usage: main.ts --framework <vercel framework slug>');

// With a project file present, `vercel build` reads its settings from it instead of pulling them,
// so no Vercel login or token is needed. An existing one (a real `vercel link`) is left alone.
if (!existsSync(PROJECT_FILE)) {
  await mkdir(dirname(PROJECT_FILE), { recursive: true });
  const project = {
    projectId: 'local-preview',
    orgId: 'local-preview',
    settings: { framework: values.framework },
  };
  await writeFile(PROJECT_FILE, `${JSON.stringify(project, null, 2)}\n`);
}

const build = spawnSync('vercel', ['build', '--prod', '--yes'], {
  stdio: 'inherit',
  env: { ...process.env, VERCEL_TELEMETRY_DISABLED: '1' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

// The functions' runtime env, as Vercel's project env would provide it; .env.local wins because
// loadEnvFile never overwrites a variable that is already set.
for (const file of ['.env.local', '.env']) if (existsSync(file)) process.loadEnvFile(file);

const port = Number(process.env['PORT'] ?? DEFAULT_PORT);
const host = process.env['HOST'] ?? DEFAULT_HOST;
const origin = `http://${host}:${port}`;
const server = createPreviewServer(await loadOutput(OUTPUT_DIR), origin);
server.listen(port, host, () => {
  process.stderr.write(`vercel-preview: serving ${OUTPUT_DIR} on ${origin}\n`);
});
