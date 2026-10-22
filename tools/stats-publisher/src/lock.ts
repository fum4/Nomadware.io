import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { LOCK_FILE_NAME } from './constants.ts';

// One run at a time per box: the timer's run and a hand-typed `mise run stats:*` share the store.
// (systemd already never overlaps two runs of the oneshot unit; this covers the manual ones.)

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the pid exists but belongs to someone else.
    return error instanceof Error && 'code' in error && error.code === 'EPERM';
  }
}

/** A release function, or null when a live run holds the lock (a dead holder's lock is taken over). */
export function acquireLock(stateDir: string): (() => void) | null {
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  const path = join(stateDir, LOCK_FILE_NAME);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      writeFileSync(path, String(process.pid), { flag: 'wx', mode: 0o600 });
      return () => rmSync(path, { force: true });
    } catch {
      let holder: number;
      try {
        holder = Number.parseInt(readFileSync(path, 'utf8'), 10);
      } catch {
        continue; // released between our write and read: try again
      }
      if (Number.isInteger(holder) && isAlive(holder)) return null;
      rmSync(path, { force: true });
    }
  }
  return null;
}
