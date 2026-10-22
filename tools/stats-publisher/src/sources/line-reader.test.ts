import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { readCompleteLines } from './line-reader.ts';

const dir = mkdtempSync(join(tmpdir(), 'stats-line-reader-'));
after(() => rmSync(dir, { recursive: true, force: true }));

function read(content: string, offset = 0): { lines: string[]; offset: number } {
  const path = join(dir, 'f.jsonl');
  writeFileSync(path, content);
  const lines: string[] = [];
  return { offset: readCompleteLines(path, offset, (line) => lines.push(line)), lines };
}

test('reads complete lines and stops before a half-written one', () => {
  assert.deepEqual(read('a\nbb\nccc'), { lines: ['a', 'bb'], offset: 5 });
});

test('resumes from an offset', () => {
  assert.deepEqual(read('a\nbb\nccc\n', 5), { lines: ['ccc'], offset: 9 });
});

test('counts bytes, not characters, and skips blank lines', () => {
  assert.deepEqual(read('é\n\nx\n'), { lines: ['é', 'x'], offset: 6 });
});

test('a line longer than one read chunk arrives whole', () => {
  const long = 'x'.repeat(5 * 1024 * 1024);
  const { lines, offset } = read(`${long}\nshort\n`);
  assert.equal(lines.length, 2);
  assert.equal(lines[0]?.length, long.length);
  assert.equal(offset, long.length + 7);
});
