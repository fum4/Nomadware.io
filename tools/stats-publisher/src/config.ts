import { homedir } from 'node:os';
import { join } from 'node:path';

import type { S3Credentials } from '@nomadware/site-stats';

import { STATE_DIR_NAME } from './constants.ts';

// The publisher's environment, read and validated here only.

function nonEmpty(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value === '' ? undefined : value;
}

const home = homedir();

export const PATHS = {
  /** Where the incremental store and the run lock live (XDG state, survives reboots). */
  stateDir: join(nonEmpty('XDG_STATE_HOME') ?? join(home, '.local', 'state'), STATE_DIR_NAME),
  /** Claude Code's transcripts: <project>/<session>.jsonl and <project>/<session>/subagents/agent-*.jsonl. */
  transcriptsDir: join(nonEmpty('CLAUDE_CONFIG_DIR') ?? join(home, '.claude'), 'projects'),
} as const;

/** The R2 write credential (secrets/site-stats-publisher.env.age via `mise run stats:publish`). */
export function readPublishCredentials(): S3Credentials {
  const accessKeyId = nonEmpty('STATS_R2_ACCESS_KEY_ID');
  const secretAccessKey = nonEmpty('STATS_R2_SECRET_ACCESS_KEY');
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'STATS_R2_ACCESS_KEY_ID / STATS_R2_SECRET_ACCESS_KEY missing: run through `mise run stats:publish`',
    );
  }
  return { accessKeyId, secretAccessKey };
}
