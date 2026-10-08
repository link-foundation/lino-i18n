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

## Portability follow-up CI

Commit `ad168d68addbf6522d52921cd0a394190ccaddaf` preceded these runs, created on 2026-10-08 at 11:24:15 UTC. All five completed successfully; complete logs and archived job metadata are preserved.

| Workflow | Run | Result |
| --- | --- | --- |
| Documentation | [37769807796](https://github.com/link-foundation/lino-i18n/actions/runs/37769807796) | Success |
| JavaScript | [37769807872](https://github.com/link-foundation/lino-i18n/actions/runs/37769807872) | Success |
| Rust | [37769807973](https://github.com/link-foundation/lino-i18n/actions/runs/37769807973) | Success |
| Security | [37769807895](https://github.com/link-foundation/lino-i18n/actions/runs/37769807895) | Success |
| Workflows | [37769807995](https://github.com/link-foundation/lino-i18n/actions/runs/37769807995) | Success |

All nine JavaScript OS/runtime combinations passed, including the Windows alias fixtures. Required dependency review and all three CodeQL languages passed without the earlier diff-size failure. Successful logs still exposed a package-test deprecation warning, addressed below. These runs validate this commit only; later fixes require their own fresh results.

## Writer queue review

Diff review identified a further concrete configuration defect: shared noncancellable writers still used GitHub's default single-pending queue. Three jobs in the same group can run/pending/replace-pending, cancelling a release or deployment. A new policy assertion fails on that configuration (`writer-queue-before.log`) and passes after all eight writers set `queue: max` (`writer-queue-after.log`). Read-only cancellable checks retain the single queue; the policy also rejects the invalid max/cancel combination.

Primary GitHub documentation confirms the queue behavior. Existing template issues JS 117 and Rust 113 previously removed this key; Rust 113's later comment correctly records the changed platform behavior and known actionlint schema lag. The current released actionlint 1.7.12 still rejects it, and upstream PR 654 remains open. `writer-queue-actionlint.log` preserves the stale diagnostic; the workflow now ignores only that exact diagnostic while policy validates its meaning. All remaining actionlint syntax, ShellCheck and Pyflakes validation stays active.

## Remaining warning, detection and cleanup regressions

- **Windows npm invocation:** `javascript-37769807872.log:2207` and `:4841` contain Node DEP0190: spawning an argument array with `shell: true` is deprecated. The package test now uses a fixed literal shell command, accommodating Windows' npm.cmd without interpolated arguments. Normal Node tests use `--throw-deprecation`. `npm-warning-before.log` reproduces the old failure under that setting and `npm-warning-after.log` passes.
- **Configuration and hooks:** a one-commit fixture demonstrates that changing `js/.prettierrc` previously emitted all-false change flags. JS configuration, changeset configuration, shared hooks and guard experiments now trigger validation. Independent Rust hook/experiment comparisons exercise the equivalent scope. `config-detection-before.log` and `rust-hook-detection-before.log` fail; their `-after.log` counterparts pass. Hook changes also start the Workflows pipeline.
- **Fragment cleanup:** the standalone Rust changelog collector previously ignored failed removal and directory reads. A portable unit fixture makes a fragment path a directory and observes the deletion error. `fragment-cleanup-before.log` fails, `fragment-cleanup-after.log` passes, and helper CI runs this regression with warnings denied. Failed cleanup now includes the path and underlying OS error.
- **Release tag annotations:** final review restored the existing description and release-label fields after moving tag creation behind successful commit publication. The real Git release fixture now verifies both fields in the remote annotated tag. `tag-notes-before.log` exposes the omission and `tag-notes-after.log` verifies the repair.

Current local checks pass all **61** JavaScript tests on Node, Bun and Deno, along with types, zero-warning ESLint, formatting, secret scanning and duplication scanning (65 files, 4.28%). Workflow policy, actionlint with the precise schema exception, and zizmor's pedantic/high-confidence/high-severity checks pass. `verification/final-checks.tar.gz` preserves these outputs as individually hashed `final-*.log` members; all 16 executable Rust helpers are checked and tested with warnings denied.

## Final-code CI and Docker argument repair

Commit `e738911dad803a34be95ad11a96d4153f2e8d7a7` preceded all five runs created at 2026-10-08 11:51:04 UTC. JavaScript, Rust, Security and Documentation passed; Workflows failed in run [37772796376](https://github.com/link-foundation/lino-i18n/actions/runs/37772796376). Its complete log identifies the cause at line 180: `could not read "queue": open queue: no such file or directory`. The Docker action runner split the single-quoted regex argument, so actionlint interpreted regex fragments as filenames. The local shell invocation had preserved that argument, which explains the difference.

The repaired workflow uses the same narrow regex with escaped space/quote characters in one whitespace-free token. `verification/docker-actionlint-after.log` verifies the exact pinned Docker image, including bundled ShellCheck and Pyflakes, rather than only the host executable. The real failure is preserved before the repair.

The same log exposed zizmor's warning that online audits were unavailable. Both invocations now receive the read-only job token and use `--strict-collection`, so malformed inputs fail instead of being skipped with warnings. `verification/online-zizmor.log` records both actual online checks passing. The subsequent complete outcomes are recorded below; no pending result is classified as successful.

## Security warning review

`security-37772796545.log:4488–4507` identifies twenty Rust helper/module files absent from Cargo's loaded source graph. CodeQL's syntax scan still ran, but macro expansion was skipped, weakening semantic coverage. The new `prepare-codeql-rust.py` generates a separate, nonpublishable manifest in the analysis checkout, reusing and validating the helpers' existing embedded dependency declarations. Its seventeen binary targets include the directly executable path utility; shared modules are reached through their existing imports. Product manifests and publication packages are unaffected. `codeql-manifest-before.log` proves the original graph includes zero helper targets; `codeql-manifest-after.log` verifies all seventeen through actual Cargo metadata. Workflows CI keeps this regression active, and fresh CodeQL logs verify actual extractor behavior.

Lines 351–361 contain eleven optional OpenSSF aggregate repository-health scores below the action's default threshold of three. These scores do not describe a vulnerability in the locked dependency version; the action's documentation separates them from vulnerability enforcement. The newly introduced dependency-review job now explicitly omits this optional heuristic annotation source. High-severity dependency review, zero-vulnerability npm lock audit and warnings-denied Cargo audit remain required. Original scores and package names remain in the full Security log for review; no vulnerability advisory is exempted.

## Complete production-code verification

Commit `18327a596801c90fce25d1aad1294fff4aa60b0a` preceded every run below, created at 2026-10-08 12:03:00 UTC. Every workflow completed successfully. Full logs, checksums, branch run list and complete per-job run metadata are preserved here.

| Workflow | Run | Result |
| --- | --- | --- |
| Documentation | [37774151243](https://github.com/link-foundation/lino-i18n/actions/runs/37774151243) | Success |
| JavaScript | [37774151242](https://github.com/link-foundation/lino-i18n/actions/runs/37774151242) | Success |
| Rust | [37774151222](https://github.com/link-foundation/lino-i18n/actions/runs/37774151222) | Success |
| Security | [37774151337](https://github.com/link-foundation/lino-i18n/actions/runs/37774151337) | Success |
| Workflows | [37774151238](https://github.com/link-foundation/lino-i18n/actions/runs/37774151238) | Success |

All nine JavaScript runtime/OS combinations, all three Rust OS jobs and the Rust package dry run passed. Security's actual extractor loads `rust/scripts/Cargo.toml` and `rust/Cargo.toml` at `security-37774151337.log:4523–4524`; the prior twenty missing-semantic-graph warnings are absent. Required dependency review, npm/Cargo audits and all three CodeQL languages passed. The exact pinned Docker action and both online zizmor invocations passed. Scanning all five full logs finds no GitHub warning annotation, `warning:`, `WARN` or deprecation warning.

## Evidence integrity and terminal validation

Repeated evidence archiving exposed a collector defect: `pr-run-*.json` also selected `pr-run-details-index.json`, bundled it, rewrote it and then deleted it as an input. `verification/archive-integrity-before.log` reproduces the missing index. The archiver now selects only numeric run IDs, restores the generated index and verifies every original record before removing individual input copies. Running it twice preserves all twenty complete PR run records and the index. `archive-integrity-after.log` verifies all run/verification archive members and each retained CI log or expired-download error against its original byte count and checksum. Workflows CI now requires this integrity check.

The last changes repair the investigation tools, add the integrity check and finalize this evidence. A separate fresh validation at the final pushed SHA is recorded in PR 24's checks and final verification comment; complete logs and job identities are downloaded to the local `verification/final-head/` directory. That directory is ignored to avoid a self-referential cycle of committing a commit's logs and requiring another validation commit. No release or production deployment is attempted from this PR branch, and expired historical logs remain explicitly unavailable.

## Passing-status false error annotations

The five runs at `a24aecf55be19ce22d0ed7059cac40a6e912b7a1`, created at 2026-10-08 12:19:49 UTC, all passed: Rust 37776088066, Workflows 37776088147, Documentation 37776088225, JavaScript 37776088162 and Security 37776088118. Their complete logs and job metadata are retained. However, inspecting Rust's annotations exposed six false errors that a conclusion-only check misses.

`rust-37776088066.log:2475–2496` contains the six expected-negative-test messages, including missing fragments, manual version changes and invalid Git refs. They were emitted by successful regression fixtures rather than failed product checks. GitHub's check-run API identifies six `failure` annotations on the successful Lint job 113307569929. The raw check-run response, all six affected jobs' annotation responses and selected job log are losslessly preserved in `verification/local-history.tar.gz` as `ci-annotations-before-check-runs.json`, `ci-annotations-<job-id>.json` and `ci-annotations-before-rust-job.log`.

The primary workflow-command documentation explains that error commands create annotations independently of process exit. Fixture printers now display captured command delimiters as plain text, preserving their messages and child exit statuses. Production guard error commands remain intact. `fixture-annotations-before.log` runs the real fixtures and fails on the leaked command; `fixture-annotations-after.log` passes all five after the repair. Rust CI executes this regression, including all four previously configured fixtures plus the shared metadata/status fixture.

The other five API annotations are `notice`: four describe hosted macOS arm64 queue capacity, and one links the product-link summary. They are informational infrastructure/report messages, not warning/failure findings. Final validation therefore checks both full log diagnostics and annotation severity, in addition to every workflow's actual conclusion and SHA.

The archive now retains 52 run/log records: 28 available full logs and 24 original expired-download errors. Historical and failed PR logs stay individual; 21 successful PR logs are in `ci-logs/pr-successful-logs.tar.gz`, with original paths, sizes and hashes in the manifest. The archiver verifies byte-for-byte readback before removing individual duplicates and is checked twice for repeatability. All archives and every member are verified in CI, keeping the PR below the diff limit while retaining the complete evidence.
