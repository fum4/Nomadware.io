import { spawnSync } from 'node:child_process';

import {
  GITHUB_AUTHOR,
  GITHUB_FILES_PAGE_SIZE,
  GITHUB_SEARCH_PAGE_SIZE,
  GITHUB_SEARCH_RESULT_CAP,
  GITHUB_SEARCH_SLICE_MS,
  GITHUB_SYNC_OVERLAP_MS,
} from '../constants.ts';
import { isExcludedPath } from '../excluded-paths.ts';
import type { MergedPr, State } from '../state.ts';

// Merged PRs via `gh` (its own auth, every repo the owner can see, private included). Only PRs
// merged since the last sync are queried; a PR already in the store is never fetched again.

const GH_MAX_BYTES = 64 * 1024 * 1024;

const SEARCH_QUERY = `query($q: String!, $first: Int!, $after: String) {
  search(type: ISSUE, query: $q, first: $first, after: $after) {
    issueCount
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number
        mergedAt
        repository { nameWithOwner }
        files(first: ${GITHUB_FILES_PAGE_SIZE}) {
          pageInfo { hasNextPage endCursor }
          nodes { path additions deletions }
        }
      }
    }
  }
}`;

const FILES_QUERY = `query($owner: String!, $name: String!, $number: Int!, $after: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      files(first: ${GITHUB_FILES_PAGE_SIZE}, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { path additions deletions }
      }
    }
  }
}`;

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface FileStat {
  path: string;
  additions: number;
  deletions: number;
}

interface FilesPage {
  pageInfo: PageInfo;
  nodes: FileStat[];
}

interface PrNode {
  number: number;
  mergedAt: string;
  repository: { nameWithOwner: string };
  files: FilesPage;
}

interface SearchResponse {
  data: {
    search: { issueCount: number; pageInfo: PageInfo; nodes: Partial<PrNode>[] };
  };
}

interface FilesResponse {
  data: { repository: { pullRequest: { files: FilesPage } } };
}

/** `gh api graphql` with string (-f) and typed (-F) variables; the parsed JSON body. */
function graphql(
  query: string,
  strings: Record<string, string>,
  typed: Record<string, number>,
): unknown {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [name, value] of Object.entries(strings)) args.push('-f', `${name}=${value}`);
  for (const [name, value] of Object.entries(typed)) args.push('-F', `${name}=${value}`);
  const result = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: GH_MAX_BYTES });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`gh api graphql exited ${String(result.status)}: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

// The GraphQL schema guarantees these shapes; a check of the envelope catches error responses.
function hasData<T>(value: unknown): value is T {
  return typeof value === 'object' && value !== null && 'data' in value && value.data !== null;
}

function isPrNode(node: Partial<PrNode>): node is PrNode {
  return (
    typeof node.number === 'number' &&
    typeof node.mergedAt === 'string' &&
    node.repository !== undefined &&
    node.files !== undefined
  );
}

function remainingFiles(pr: PrNode, after: string): FileStat[] {
  const [owner = '', name = ''] = pr.repository.nameWithOwner.split('/');
  const files: FileStat[] = [];
  let cursor: string | null = after;
  while (cursor) {
    const response = graphql(FILES_QUERY, { owner, name, after: cursor }, { number: pr.number });
    if (!hasData<FilesResponse>(response)) throw new Error('GitHub files query returned no data');
    const page = response.data.repository.pullRequest.files;
    files.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  }
  return files;
}

function toMergedPr(pr: PrNode): MergedPr {
  const { files } = pr;
  const all =
    files.pageInfo.hasNextPage && files.pageInfo.endCursor
      ? [...files.nodes, ...remainingFiles(pr, files.pageInfo.endCursor)]
      : files.nodes;
  let linesAdded = 0;
  let linesDeleted = 0;
  for (const file of all) {
    if (isExcludedPath(file.path)) continue;
    linesAdded += file.additions;
    linesDeleted += file.deletions;
  }
  return {
    mergedAtMs: Date.parse(pr.mergedAt),
    repo: pr.repository.nameWithOwner,
    linesAdded,
    linesDeleted,
  };
}

const isoSeconds = (ms: number): string => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** Every merged PR in [fromMs, toMs], new ones fetched into the store. */
function syncSlice(state: State, fromMs: number, toMs: number): number {
  const q = `is:pr is:merged author:${GITHUB_AUTHOR} merged:${isoSeconds(fromMs)}..${isoSeconds(toMs)}`;
  let added = 0;
  let after: string | null = null;
  do {
    const strings: Record<string, string> = after ? { q, after } : { q };
    const response = graphql(SEARCH_QUERY, strings, { first: GITHUB_SEARCH_PAGE_SIZE });
    if (!hasData<SearchResponse>(response)) throw new Error('GitHub search returned no data');
    const { search } = response.data;
    if (search.issueCount >= GITHUB_SEARCH_RESULT_CAP) {
      throw new Error(
        `search slice has ${search.issueCount} results, over the cap: shrink the slice`,
      );
    }
    for (const node of search.nodes) {
      if (!isPrNode(node)) continue;
      const key = `${node.repository.nameWithOwner}#${node.number}`;
      if (state.github.prs[key]) continue;
      state.github.prs[key] = toMergedPr(node);
      added += 1;
    }
    after = search.pageInfo.hasNextPage ? search.pageInfo.endCursor : null;
  } while (after);
  return added;
}

export interface GithubScan {
  slices: number;
  added: number;
}

/** Fetch PRs merged since the last sync (first run: since `cutoffMs`); drop older ones. */
export function updateGithub(state: State, cutoffMs: number, nowMs: number): GithubScan {
  const { github } = state;
  const fromMs =
    github.syncedThroughMs === null
      ? cutoffMs
      : Math.max(cutoffMs, github.syncedThroughMs - GITHUB_SYNC_OVERLAP_MS);
  const scan: GithubScan = { slices: 0, added: 0 };
  for (let start = fromMs; start < nowMs; start += GITHUB_SEARCH_SLICE_MS) {
    scan.added += syncSlice(state, start, Math.min(nowMs, start + GITHUB_SEARCH_SLICE_MS));
    scan.slices += 1;
  }
  github.syncedThroughMs = nowMs;
  for (const [key, pr] of Object.entries(github.prs)) {
    if (pr.mergedAtMs < cutoffMs) delete github.prs[key];
  }
  return scan;
}
