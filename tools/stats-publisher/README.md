# `tools/stats-publisher` — the site's live stats, computed on the devbox

**What:** computes the live stats card on nomadware.io (its numbers and activity chart) (NWARE-82) from the devbox's own activity and uploads it to R2 as `v1/stats.json` (`@nomadware/site-stats` § `STATS_OBJECT`). Runs every 5 minutes from the devbox timer `nomadware-site-stats.timer` (devbox `chezmoi/`), which calls `mise run stats:publish` in the main checkout. Package `@nomadware/stats-publisher`.

**Depends on:** `@nomadware/site-stats` (the snapshot contract + R2 signing) and, on the box: `~/.claude/projects` (Claude Code transcripts), the user journal (`journalctl --user`), `gh` (its own auth). Node runs `src/main.ts` directly (type stripping) — no build, no runtime dependencies.

**Run:**

| Command | Does |
|---|---|
| `mise run stats:compute` | update the store, print the snapshot JSON (no upload) |
| `mise run stats:compute -- --dry-run` | the same without saving the store |
| `mise run stats:publish` | update the store, upload (S3 keys of R2 token `nomadware-io-site-stats-write` from `secrets/site-stats-publisher.env.age`) |

Each run logs one logfmt line per source and a `run done` line with `duration_ms`, `cpu_ms`, `max_rss_mb` and `store_kb` to stderr — `journalctl --user -u nomadware-site-stats` for the timer's runs (systemd adds its own "Consumed … CPU time, … memory peak" line).

**What each number is** (rolling 7d / 30d windows ending at `generatedAt`, UTC):

| Stat | Source | Measured as |
|---|---|---|
| `prs`, `repos` | GitHub search via `gh` | PRs authored by `fum4`, merged in the window, every repo incl. private; distinct repos among them |
| `linesAdded`, `linesDeleted` | per-PR file stats | summed over the PR's files minus `EXCLUDED_PATH_PATTERNS` (`src/excluded-paths.ts`: lockfiles, build output, generated code, minified files, snapshots) |
| `runs` | transcripts | `.jsonl` files (main sessions + `subagents/agent-*.jsonl`) with a user/assistant entry in the window |
| `agentHours` | transcripts | per file, the gaps between consecutive user/assistant entries shorter than 5 min, summed, rounded |
| `actions` (the page's "agent tool calls") | transcripts | `tool_use` blocks in assistant entries. Claude Code writes one line per content block, all repeating the message id, so counting is per line — deduping by message id would drop tool calls |
| `checks`, `caught` | user journal | systemd's `pc-*.pre-push/pre-merge.service: Consumed …` (a gate run finished) / `… Failed with result …` (it failed). Every failed run is one caught issue, no dedupe |
| `series.agentMinutes` | transcripts | the same per-minute active time as `agentHours`, summed per chart bucket (UTC-aligned, `@nomadware/site-stats` § Series), rounded to whole minutes |
| `series.prsMerged` | GitHub | the same merged PRs as `prs`, per bucket of their merge time |
| `series.linesAdded`, `series.linesDeleted` | per-PR file stats | each PR's `linesAdded` / `linesDeleted` in its merge bucket; a bucket with no merge is 0 |
| `series.runs` | transcripts | each transcript once, in the bucket of its first activity inside the series |
| `series.actions` | transcripts | the per-minute `tool_use` counts behind `actions`, summed per bucket |
| `series.checks`, `series.caught` | user journal | the same gate runs / failures as `checks` / `caught`, per bucket they finished in |
| `series.caughtFixMinutes` | user journal | per gate unit (one worktree's pre-push or pre-merge), the failures up to its next pass are one episode, fixed when that pass ends, timed from the episode's first failure (`src/fix-times.ts`); per bucket the longest among its failures, `null` if it caught none or one is unfixed (no pass yet, or the worktree went first: the unit is the only identity the journal keeps). The gate's output goes to the pushing terminal (`devstack gate` runs it with `--pipe`), not the journal, so *what* failed (lint, tests, …) is not knowable here |

The series (`src/series.ts`) is aligned to UTC buckets, not to the rolling window, so its totals can differ slightly from the window's numbers at the edges.

**Incremental store:** `~/.local/state/nomadware-site-stats/state.json` (`src/state.ts`; local only — it holds file paths and repo names, never published). Per transcript a byte offset and per-minute totals; the journal cursor, gate run timestamps and, per failed / passing run, its gate unit (to time fixes); every merged PR's line counts (merged PRs are immutable, so each is fetched once). Anything older than 31 days is dropped. A run reads only appended bytes, journal entries after the cursor and PRs merged since the last sync (minus a 1 h overlap for search-index lag). Delete the file to force a backfill; a `STATE_VERSION` bump does the same. A lock (`run.lock`, pid-checked) keeps a manual run and the timer's apart.

**Cost** (measured 2026-10-22: 1,574 transcripts / 2.7 GB, 555 PRs in 31 d): backfill ~103 s wall (GitHub ~90 s of it), 12 s CPU, 305 MB peak RSS, 0.8 MB store; an incremental run ~1.3 s wall, ~0.2 s CPU, ~105 MB peak RSS.

**Failure:** a failing source keeps its previous data, the snapshot still goes out, and the run exits 1 (the unit turns red, `devbox-doctor` sees it). A failed upload exits 1; the site keeps serving the last object.

**Extend:** a new source is a module under `src/sources/` that folds new data into `State` (bump `STATE_VERSION`) and a few lines in `src/aggregate.ts` (a series: `src/series.ts`); the stat itself is added to the contract first (`packages/site-stats` README § Extend). Tests: `src/**/*.test.ts` (`node --test`, hermetic — temp files, no network).
