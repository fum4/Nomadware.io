// Tunables of the stats publisher. What a number means is documented on StatWindowValues
// (@nomadware/site-stats); how each is measured is in this package's README.

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** The store keeps a day more than the widest window, so a window edge never reads a pruned gap. */
export const RETENTION_DAYS = 31;

/** Gaps between a session's entries count as agent time only below this; longer = idle. */
export const IDLE_GAP_MS = 5 * MINUTE_MS;

/** Whose merged PRs count. */
export const GITHUB_AUTHOR = 'fum4';
/** Re-query this far behind the last sync: GitHub's search index lags a merge by minutes. */
export const GITHUB_SYNC_OVERLAP_MS = HOUR_MS;
/** Search returns at most 1,000 results per query; slicing the range keeps each slice far below. */
export const GITHUB_SEARCH_SLICE_MS = 3 * DAY_MS;
export const GITHUB_SEARCH_RESULT_CAP = 1_000;
export const GITHUB_SEARCH_PAGE_SIZE = 50;
export const GITHUB_FILES_PAGE_SIZE = 100;

/** systemd's own end-of-run lines for the git-hook gate units (`devstack gate`). */
export const GATE_JOURNAL_PATTERN =
  '^pc-.*\\.pre-(push|merge)\\.service: (Consumed|Failed with result)';

export const TRANSCRIPT_READ_CHUNK_BYTES = 4 * 1024 * 1024;

export const STATE_DIR_NAME = 'nomadware-site-stats';
export const STATE_FILE_NAME = 'state.json';
export const LOCK_FILE_NAME = 'run.lock';
