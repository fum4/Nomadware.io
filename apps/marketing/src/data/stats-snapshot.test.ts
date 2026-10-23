import { describe, expect, it } from 'vitest';

import { BUNDLED_STATS_SNAPSHOT } from './stats-snapshot';

describe('BUNDLED_STATS_SNAPSHOT', () => {
  it('passes the contract with its chart series', () => {
    expect(BUNDLED_STATS_SNAPSHOT.series?.['7d'].agentMinutes).toHaveLength(84);
    expect(BUNDLED_STATS_SNAPSHOT.series?.['30d'].linesAdded).toHaveLength(120);
  });
});
