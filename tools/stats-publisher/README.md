# `tools/stats-publisher` — the site's live stats, computed on the devbox

**What:** computes the stats strip on nomadware.io (NWARE-82) from the devbox's own activity and uploads it to R2 as `v1/stats.json` (`@nomadware/site-stats` § `STATS_OBJECT`). Runs every 5 minutes from the devbox timer `nomadware-site-stats.timer` (devbox `chezmoi/`), which calls `mise run stats:publish` in the main checkout. Package `@nomadware/stats-publisher`.

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
| `actions` | transcripts | `tool_use` blocks in assistant entries. Claude Code writes one line per content block, all repeating the message id, so counting is per line — deduping by message id would drop tool calls |
| `checks`, `caught` | user journal | systemd's `pc-*.pre-push/pre-merge.service: Consumed …` (a gate run finished) / `… Failed with result …` (it failed) |

**Incremental store:** `~/.local/state/nomadware-site-stats/state.json` (`src/state.ts`; local only — it holds file paths and repo names, never published). Per transcript a byte offset and per-minute totals; the journal cursor and gate timestamps; every merged PR's line counts (merged PRs are immutable, so each is fetched once). Anything older than 31 days is dropped. A run reads only appended bytes, journal entries after the cursor and PRs merged since the last sync (minus a 1 h overlap for search-index lag). Delete the file to force a backfill; a `STATE_VERSION` bump does the same. A lock (`run.lock`, pid-checked) keeps a manual run and the timer's apart.

**Cost** (measured 2026-10-22: 1,574 transcripts / 2.7 GB, 555 PRs in 31 d): backfill ~103 s wall (GitHub ~90 s of it), 12 s CPU, 305 MB peak RSS, 0.8 MB store; an incremental run ~1.3 s wall, ~0.2 s CPU, ~105 MB peak RSS.

**Failure:** a failing source keeps its previous data, the snapshot still goes out, and the run exits 1 (the unit turns red, `devbox-doctor` sees it). A failed upload exits 1; the site keeps serving the last object.

**Extend:** a new source is a module under `src/sources/` that folds new data into `State` (bump `STATE_VERSION`) and a few lines in `src/aggregate.ts`; the stat itself is added to the contract first (`packages/site-stats` README § Extend). Tests: `src/**/*.test.ts` (`node --test`, hermetic — temp files, no network).
