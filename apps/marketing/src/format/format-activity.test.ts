import { describe, expect, it } from 'vitest';

import {
  formatAgentTime,
  formatBucketRange,
  formatIssuesCaught,
  formatPrsMerged,
} from './format-activity';

describe('formatAgentTime', () => {
  it('prints hours and minutes, dropping a zero part', () => {
    expect(formatAgentTime(100)).toBe('1h 40m');
    expect(formatAgentTime(120)).toBe('2h');
    expect(formatAgentTime(40)).toBe('40m');
    expect(formatAgentTime(0)).toBe('0m');
    expect(formatAgentTime(382)).toBe('6h 22m');
  });
});

describe('formatBucketRange', () => {
  const start = Date.parse('2026-10-21T14:00:00Z');
  const end = Date.parse('2026-10-21T16:00:00Z');

  it('reads short weekday, day, month and 24h times', () => {
    expect(formatBucketRange(start, end, 'UTC')).toBe('Wed 21 Oct · 14:00–16:00');
  });

  it('shows the visitor’s zone, a bucket ending at midnight as 00:00', () => {
    expect(formatBucketRange(start, end, 'Europe/Bucharest')).toBe('Wed 21 Oct · 17:00–19:00');
    const late = Date.parse('2026-10-21T18:00:00Z');
    expect(formatBucketRange(late, late + 6 * 3_600_000, 'UTC')).toBe('Wed 21 Oct · 18:00–00:00');
  });
});

describe('formatPrsMerged', () => {
  it('pluralises and groups', () => {
    expect(formatPrsMerged(1)).toBe('1 PR merged');
    expect(formatPrsMerged(0)).toBe('0 PRs merged');
    expect(formatPrsMerged(1240)).toBe('1,240 PRs merged');
  });
});

describe('formatIssuesCaught', () => {
  it('says issue for one, issues otherwise', () => {
    expect(formatIssuesCaught(1, null)).toBe('1 issue caught');
    expect(formatIssuesCaught(3, null)).toBe('3 issues caught');
  });

  it("adds the time to fix, in the tooltip's own hours and minutes", () => {
    expect(formatIssuesCaught(3, 14)).toBe('3 issues caught · fixed in 14m');
    expect(formatIssuesCaught(1, 80)).toBe('1 issue caught · fixed in 1h 20m');
  });
});
