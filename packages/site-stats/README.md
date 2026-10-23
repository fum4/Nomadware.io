# `packages/site-stats` — the live-stats contract

**What:** the one home for the stats snapshot both sides of the live-stats pipeline agree on (NWARE-82): its shape (`StatsSnapshot`, `STAT_WINDOWS`, `STAT_KEYS`; the activity chart's optional `series`, `src/series.ts`), the validator every reader runs on untrusted JSON (`parseStatsSnapshot`), and where the snapshot lives in R2 (`STATS_OBJECT`, `putStatsObject`, `getStatsObject`). Package `@nomadware/site-stats`.

**Depends on:** nothing — no runtime dependencies. R2 requests are signed by `src/sigv4.ts` (AWS Signature V4, WebCrypto only, pinned by AWS's published examples in `sigv4.test.ts`), so the same code runs on bare Node (the publisher) and in Vercel's runtime (the site).

**Used by:** `tools/stats-publisher` (writes) and `apps/marketing` (reads).

**Public API:** everything is exported from `src/index.ts` (`import { … } from '@nomadware/site-stats'`). The package ships TypeScript sources (`exports` → `src/index.ts`): Node runs them with type stripping, Vite bundles them. So: erasable syntax only, relative imports with `.ts` extensions (`tsconfig.node.json`).

**Series** (`src/series.ts`): per window, `{ bucketHours, agentMinutes[], prsMerged[], days[] }` — agent-minutes and merged PRs per bucket (7d: 2 h × 84, 30d: 6 h × 120; buckets aligned to UTC multiples of `bucketHours`, the last one holding `generatedAt`, `bucketStartMs` says where each starts) and, per UTC day (7 / 30, the last one `generatedAt`'s), `{ date, linesAdded, linesDeleted }`. Every count a non-negative integer and every length exact, or the series is dropped — as a whole, keeping the snapshot: a snapshot without it (an older publisher) is valid, and the site shows its numbers without the chart.

**Extend:** a new stat is a field on `StatWindowValues`, a `STAT_KEYS` entry and a line in `parseStatsSnapshot` (a new series: a field on `StatSeries` and its line in `parseWindowSeries`); then the publisher computes it and the site shows it. A breaking shape change is a new object key (`v2/stats.json`) so a deployed site never reads a shape it doesn't know.

**Run:** `pnpm --filter @nomadware/site-stats test` · `… typecheck` (both also run from the root: `mise run test`, `pnpm check:types`).
