import { caughtCategory } from '../caught-category.ts';
import { GATE_TASK_PAIRING_MS } from '../constants.ts';
import type { JournalState } from '../state.ts';

// The gate lines the journal source reads, parsed and folded into the store. systemd logs
// "<unit>: Failed with result …" when a gate unit failed (a catch), then "<unit>: Consumed …" as
// any run ends (a check); a run that ends without a failure first is a pass. After a failed run,
// `devstack gate` adds its own line (SYSLOG_IDENTIFIER devstack-gate, devbox docs/ci.md):
// `gate=pre-push unit=<unit> result=failed task=<task> [cmd="<failing step>"]`, the failure's
// category. Unit names (worktree slugs), tasks and commands stay on the box: the store keeps the
// unit (to pair a failure with its unit's next pass) and the category only.

export type GateEvent =
  | { kind: 'failed' | 'ended'; atMs: number; unit: string; cursor: string }
  | { kind: 'task'; atMs: number; unit: string; task: string; cmd?: string; cursor: string };

// journald's own (double-underscore) fields.
const CURSOR_FIELD = '__CURSOR';
const REALTIME_FIELD = '__REALTIME_TIMESTAMP';
const LOGFMT_PAIR = /(\w+)=("(?:[^"\\]|\\.)*"|\S*)/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** `key=value key="quoted \"value\""` → its fields. */
export function parseLogfmt(message: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const [, key = '', raw = ''] of message.matchAll(LOGFMT_PAIR)) {
    const quoted = raw.startsWith('"') && raw.endsWith('"') && raw.length > 1;
    fields.set(key, quoted ? raw.slice(1, -1).replaceAll(/\\(.)/g, '$1') : raw);
  }
  return fields;
}

function parseMessage(message: string, atMs: number, cursor: string): GateEvent | null {
  if (message.startsWith('gate=')) {
    const fields = parseLogfmt(message);
    const unit = fields.get('unit');
    const task = fields.get('task');
    if (!unit || !task || fields.get('result') !== 'failed') return null;
    const cmd = fields.get('cmd');
    return { kind: 'task', atMs, unit, task, ...(cmd ? { cmd } : {}), cursor };
  }
  const unit = message.slice(0, message.indexOf(': '));
  if (!unit) return null;
  const kind = message.includes(': Failed with result') ? 'failed' : 'ended';
  return { kind, atMs, unit, cursor };
}

export function parseGateEvent(line: string): GateEvent | null {
  let entry: unknown;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  if (!isRecord(entry)) return null;
  const message = entry['MESSAGE'];
  const cursor = entry[CURSOR_FIELD];
  const realtimeUs = entry[REALTIME_FIELD];
  if (typeof message !== 'string' || typeof cursor !== 'string' || typeof realtimeUs !== 'string') {
    return null;
  }
  const atMs = Math.floor(Number(realtimeUs) / 1000);
  return Number.isFinite(atMs) ? parseMessage(message, atMs, cursor) : null;
}

/**
 * One gate line into the store: a failure; a run's end (a pass unless its unit just failed); or
 * the failing task, which categorises its unit's latest failure (logged just before it).
 */
export function foldGateEvent(journal: JournalState, event: GateEvent): void {
  const { atMs, unit } = event;
  if (event.kind === 'task') {
    const failure = journal.failed.findLast((run) => run.unit === unit);
    if (failure && !failure.category && atMs - failure.atMs <= GATE_TASK_PAIRING_MS) {
      failure.category = caughtCategory(event.task, event.cmd);
    }
    return;
  }
  if (event.kind === 'failed') {
    journal.failed.push({ atMs, unit });
    if (!journal.failing.includes(unit)) journal.failing.push(unit);
    return;
  }
  journal.checksMs.push(atMs);
  if (journal.failing.includes(unit)) {
    journal.failing = journal.failing.filter((other) => other !== unit);
  } else {
    journal.passed.push({ atMs, unit });
  }
}
