# PR verification and follow-up fixes

All run records below refer to [PR 24](https://github.com/link-foundation/lino-i18n/pull/24). Historical failures and requirements are analyzed in [ANALYSIS.md](ANALYSIS.md). Full logs are preserved verbatim; `ci-logs/manifest.json` records identity and checksums.

## First implementation CI

Commit `126f834bca60d8ac9a29766c0205daf813f61093` was pushed before these five runs, each created at 2026-10-08 11:06:53 UTC. Therefore these results are fresh implementation feedback, rather than the historical main failures.

| Workflow/run | Result | Evidence and actual cause |
| --- | --- | --- |
| Rust / 37767930096 | Success | All Linux/macOS/Windows tests, lint/helper checks, version guard, package and terminal gate pass |
| Documentation / 37767930240 | Success | Required documentation, JS/Rust site assembly, live product links and terminal gate pass |
| JavaScript / 37767930114 | Failure | `javascript-37767930114.log:1957` shows `RUNNER~1` versus `runneradmin`: a Windows filesystem alias makes lexical relative paths point outside the repository. All three Windows runtimes fail the version guard/release fixture; other JS jobs pass |
| Workflows / 37767930202 | Failure | `workflows-37767930202.log:383–384` reports missing `rg`; line 392 proves the hook fixture detects skipped validation. The hook depended on a tool absent from the hosted runner |
| Security / 37767930346 | Failure | `security-37767930346.log:399` identifies the disabled repository dependency graph. npm audit, Cargo audit and all three CodeQL languages pass. CodeQL additionally warns that the initial diff exceeds GitHub's 300-file limit |

## Reproductions and repairs

1. **Filesystem aliases:** the real JS release fixture now passes a junction/symlink package root. `verification/path-alias-before.log` fails with an outside-repository Git path on Linux, reproducing the Windows defect without a Windows host. Both `check-version.mjs` and `version-and-commit.mjs` now use Node's native realpath for both operands before relative-path calculation. The version guard uses an aliased root and still rejects an actual version edit. `path-alias-after.log` passes. Fixture repositories explicitly disable automatic newline conversion to avoid unrelated Windows warnings.
2. **Hook portability:** `experiments/issue-23-hook.py` deliberately makes `rg` unavailable while generating a finite 10,000-path staged list. Bash built-in path matching now selects both language checks without an external search utility or a pipe under `pipefail`. `hook-portability-before.log` fails and `portable-hook.log` passes. The meaningful regression stays in workflow CI.
3. **Repository prerequisite:** enabling vulnerability alerts through GitHub's documented endpoint also enables the dependency graph. `github/enable-dependency-graph.txt` records the successful PUT, and `dependency-graph-enabled.txt` records the GET returning HTTP 204. Dependency review remains required and fails on high-severity findings; its next real run verifies the setting change.
4. **Reviewable evidence:** pinned template source files and intermediate local logs are losslessly archived with individual checksums and full inventories. Important before/after and all available GitHub CI logs remain accessible. This removes the diff API's 300-file failure while preserving the initial raw-file commit in history. [README.md](README.md) gives extraction instructions.

## Local follow-up checks

The configured Node, Bun and Deno commands each pass all 60 tests after the alias fix. Types, ESLint with zero warnings, formatting, duplication scanning, hook regression, policy and actionlint pass. Results are in `verification/portable-*.log`. An exploratory Deno invocation omitted the repository's `--no-check` flag; its declaration-resolution errors are preserved as `deno-unconfigured-command.log`. The configured runtime test command passes, and the separate TypeScript check passes.

Latest-SHA workflow outcomes will be appended after the follow-up push; no pending or older result is classified as successful final CI.
