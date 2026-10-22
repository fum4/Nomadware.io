import { closeSync, openSync, readSync } from 'node:fs';

import { TRANSCRIPT_READ_CHUNK_BYTES } from '../constants.ts';

const NEWLINE = 0x0a;

/**
 * Feed every complete line from `offset` to the end of the file to `onLine`; return the offset just
 * past the last newline. A trailing line still being written is left for the next run.
 */
export function readCompleteLines(
  path: string,
  offset: number,
  onLine: (line: string) => void,
): number {
  const fd = openSync(path, 'r');
  try {
    const chunk = Buffer.allocUnsafe(TRANSCRIPT_READ_CHUNK_BYTES);
    let consumed = offset;
    let position = offset;
    let carry: Buffer = Buffer.alloc(0);
    for (;;) {
      const bytesRead = readSync(fd, chunk, 0, chunk.length, position);
      if (bytesRead === 0) break;
      position += bytesRead;
      const data = carry.length > 0 ? Buffer.concat([carry, chunk.subarray(0, bytesRead)]) : chunk;
      const end = carry.length > 0 ? data.length : bytesRead;
      let start = 0;
      for (let newline = data.indexOf(NEWLINE, start); newline !== -1 && newline < end;) {
        if (newline > start) onLine(data.toString('utf8', start, newline));
        consumed += newline + 1 - start;
        start = newline + 1;
        newline = data.indexOf(NEWLINE, start);
      }
      // Copy: `chunk` is reused by the next read.
      carry = Buffer.from(data.subarray(start, end));
    }
    return consumed;
  } finally {
    closeSync(fd);
  }
}
