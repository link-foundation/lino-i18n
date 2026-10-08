# Issue 23: CI/CD investigation and implementation

This investigation addresses [issue 23](https://github.com/link-foundation/lino-i18n/issues/23) in [PR 24](https://github.com/link-foundation/lino-i18n/pull/24). It preserves the available evidence, separates observed failures from uncertain external state, and implements the applicable practices across JavaScript, Rust, documentation, security and workflow validation.

## Evidence and scope

The issue, its complete comment collection, PR conversation comments, inline review comments and reviews are preserved in `github/`. The issue initially had no comments. Related merged PRs 18, 20 and 22 and their three comment collections were inspected. `github/local-file-tree.txt` records the original repository inventory.

The collector inspected 27 historical main-branch runs. GitHub still supplied complete logs for three: the two failures named in the issue and the contemporaneous successful JavaScript release. The other 24 May runs had expired logs; each unsuccessful download and stderr are preserved. `ci-logs/manifest.json` records every attempt, original SHA, timestamp, conclusion, size and SHA-256. Empty files are failed downloads, not evidence of successful runs. Fresh PR run records and logs are added during verification.

The JavaScript template was pinned to `4973fc4cedd4a1b5cf51fa6a3b2ddd56e6741549`; the Rust template to `cece347b3cd3a0b715583d7294e1fd93ad2d4c56`. Their complete tracked inventories contain 428 and 171 files. All workflows, composite actions, scripts, CI configuration and relevant regression tests are archived under `templates/`; the complete inventories also identify product examples and historical research that do not belong in this library. See [TEMPLATE-COMPARISON.md](TEMPLATE-COMPARISON.md) and the per-file coverage data.

The referenced best-practices document is preserved in `research/CI-CD-BEST-PRACTICES.md`. Online findings use primary documentation; [SOURCES.md](SOURCES.md) records URLs, applicability and limits. All reproduction scripts live in `experiments/`, use finite local fixtures, and avoid real package publication. Routine command output is preserved in `verification/`.

## Requirements and completion criteria

| ID | Requirement from the issue or requested investigation | Application and review evidence |
| --- | --- | --- |
| R1 | Investigate and fix the reported JavaScript main failure | Historical publish replay, registry/publish unit tests, one-publication readback state machine |
| R2 | Investigate and fix the reported Rust main failure | Actual release helper in a local bare-repository race fixture; synchronize while clean, then version |
| R3 | Find false positives and false negatives throughout CI/CD | Full-PR comparisons; semantic manifest guards; genuine new fragments; fatal invalid refs and output writes; complete terminal gates |
| R4 | Resolve warnings and errors | Zero-warning ESLint/Clippy/helper compilation; supported runners and current Actions; deprecated React renderer replaced; exact dependency audits |
| R5 | Inspect full file trees and every CI workflow/script in both templates | Pinned source archives, full inventories and per-file comparison mapping |
| R6 | Reuse applicable JavaScript practices first, and Rust practices | Existing Changesets/Rust helpers retained and repaired; shared guards, credential probes and tested link retry helpers reused |
| R7 | Apply all 17 referenced CI/CD principles | Principle matrix below, including explicit container applicability |
| R8 | Report the same defects in upstream templates | Existing staging issue 158 supplemented with reproduction and distinction; Rust template issue 192 created with reproduction, workaround and code suggestion |
| R9 | Keep all changes in this PR and preserve existing features | PR 24 only; JS/Rust APIs and supported runtime engines retained; manual release PR and instant modes, both docs sites and npm recovery retained |
| R10 | Download logs and collect related data in the requested folder | This directory; manifests identify unavailable expired logs without inventing their contents |
| R11 | Deep analysis, online research, timeline, each root cause and solution plans | This report, sources, complete coverage mapping and experiments |
| R12 | Add disabled-by-default diagnostics where evidence is insufficient | `DEBUG=1` for comparison, registry and release helpers; `PIPELINE_STATUS_VERBOSE=1` for gate classification; ambiguous HTTP states fail with context |
| R13 | Reproduce bugs before fixes and verify across the codebase | Before/after logs and committed regression fixtures for git, publishing, metadata merging, output I/O and status gates |
| R14 | Prepare a release trigger, run local checks, update/ready existing PR, verify latest-SHA CI | JS patch changeset and Rust patch fragment; final verification record and PR description |

## Timeline reconstructed from evidence

| UTC time | Event | Evidence and consequence |
| --- | --- | --- |
| 2026-05-17 to 2026-05-18 | Earlier pipeline repairs and release failures/successes | Run metadata and merged PR 18 survive. Logs expired, so their exact failure causes cannot be reconstructed from current downloads. |
| 2026-07-12 12:25:03 | JavaScript run 29192577200 and Rust run 29192577217 start at `a70b0cd817afe3a0ab8de91bbd2cc09aa30cb03f` | Same validated source, independently executing releases. |
| 2026-07-12, during Rust release | Rust updates/stages release files, fetches main, then rebases | `ci-logs/rust-29192577217.log:5679–5680`: `cannot rebase: Your index contains uncommitted changes.` The helper exits unsuccessfully before publication. |
| 2026-07-12, overlapping release | JavaScript advances main with release metadata | The successful JavaScript log and Rust fetch/rebase establish the cross-language writer race. Serializing writers alone would still leave an old checkout. |
| 2026-10-07 02:15:02 | JavaScript run 37561074975 starts at `840c58d44ccade129c0cfc13f7531894e80eea77` | This is the issue's JavaScript failure, not a run for the later release commit. |
| 2026-10-07 02:16:55–02:16:57 | Version 0.3.0 commit `36ff249dd256393ff4c8e1bf5e42bc04b3db166c` is committed and pushed | `javascript-37561074975.log:7942` and adjacent timestamped lines. Main advances before publication is verified. |
| 2026-10-07 02:16:58 | Exact registry version read returns 404 | The version is not publicly visible at this read. A 404 cannot explain why. |
| 2026-10-07 02:17:03 | First npm publish reports acceptance and creates a local version tag | `javascript-37561074975.log:7981`. The write is accepted, but public readback has not succeeded. |
| 2026-10-07 02:17:06 | Exact version still returns 404 | `javascript-37561074975.log:8007`. The old publisher treats this as permission to publish again. |
| 2026-10-07 02:17:16 and 02:17:30 | Repeated writes return E409 | Lines 8017 and 8058: `Cannot publish over previously staged version "0.3.0".` Three writes to the same version cause a failed release and missing GitHub release. |
| 2026-10-08 09:37:47 | Issue 23 created | Its context correctly names main's latest release commit while referencing earlier triggering SHAs. |
| 2026-10-08 investigation | Baselines reproduced; templates and primary documentation reviewed | Local fixtures expose additional skipped-change, manifest, fragment, merge and output-write defects. Before and after logs are preserved. |

The npm logs prove accepted publication followed by invisible readback and duplicate writes. They do **not** prove whether invisibility was transient propagation, a staged approval requirement, or another registry state. Current npm documentation explicitly describes staged versions that stay invisible until 2FA approval. The implementation handles both possibilities without pretending an OIDC token can approve a stage.

## Root causes, alternative solutions and implemented plans

### 1. npm duplicate publication and ambiguous registry reads

Cause: the publisher conflated "not yet publicly visible" with "not yet written". It retried publish after an accepted write and treated ambiguous read errors as absence. The reproducing experiment replays the old script with mocked bounded I/O and demonstrates three publish calls for one version.

Options considered: extend the sleep (does not fix approval or duplicate writes); repeatedly retry writes (reproduces E409); classify write results and separately poll visibility (selected).

Plan applied in `npm-registry.mjs`, `publish-retry.mjs`, `publish-to-npm.mjs`, release detection and npm wait helpers: exact uncached version reads, schema/version validation, finite HTTP deadlines, 404-only absence, and nonzero failure on unknown states. After acceptance or the staged-version E409, only readback is retried. Transient failed writes retain a finite retry budget. Outputs and success require verified public visibility. Exhaustion names the package/version and the possible staging approval requirement. It never emits a false success or approves a stage.

Both automatic and manual releases call the same publisher. Five focused tests cover accepted/invisible, staged conflict, propagation, terminal errors and bounded exhaustion. `issue-23-publish-baseline.mjs` preserves the failing original behavior. The writer budget accounts for finite polling and request deadlines rather than hiding a repeated timeout pattern.

### 2. Rust dirty rebase and concurrent release metadata

Cause: the helper dirtied its worktree before attempting to rebase a concurrently advanced main. JavaScript and Rust writers were also globally cancellable and separately queued.

Options considered: force push (would lose history); check out latest main directly (would publish unvalidated source); clean synchronization followed by versioning, shared noncancellable writer queue and bounded classified push retries (selected).

Both helpers now synchronize while clean, validate that differences from the tested commit contain only permissible release metadata, and reject source/dependency changes. They update versions and consume fragments after synchronization, validate staged paths, commit, push and only then expose success outputs. Only genuine non-fast-forward push rejection is retried; GH006/GH013 branch-rule rejection, auth and network errors fail with their real diagnostics. No force push is used. Rust tags the successfully pushed release commit and publishes macros before the dependent runtime, using locked Cargo state.

The shared writer group explicitly uses `queue: max`. GitHub's default single-pending queue can otherwise cancel the second writer when a third arrives, even with `cancel-in-progress: false`. All eight JS/Rust release, manual-PR and Pages writers retain up to 100 pending jobs; overflow still fails visibly. The current actionlint 1.7.12 has a documented schema lag ([issue 657](https://github.com/rhysd/actionlint/issues/657), unmerged PR 654), so only its exact stale queue-key diagnostic is ignored. Workflow policy validates writer `queue: max` and rejects that queue on cancellable checks. Both pinned templates also omit the setting after older removals; upstream discussions and their later correction are preserved.

The actual Rust script is exercised against a temporary bare remote with an intervening JavaScript metadata commit. The fixture stubs registry reads only and verifies workspace version inheritance, local path dependency requirements, lock metadata, fragment consumption and the remote release tag. JavaScript has the reciprocal release fixture and detached-checkout coverage.

A later external writer that changes the same package's chosen version cannot be silently accepted: overlapping metadata rebases fail. The shared queue prevents this repository's two language writers from overlapping; the initial clean synchronization recomputes release decisions from accepted metadata. The safe recovery for an incompatible outside race is a fresh run, not a replayed stale publication.

### 3. Whole-change detection and manifest guards

Cause: merge-parent heuristics compared only the final PR commit; missing refs were converted into empty diffs; `.d.ts`, member crates and config/lock changes were incompletely recognized. Rust also interpreted an empty diff as an initial commit. JavaScript checked the wrong root manifest, and text-based checks flagged harmless formatting while missing workspace/member versions. Arbitrary branch names could bypass a guard.

Options considered: broaden only file suffix lists (would leave the wrong comparison range); use explicit event refs with a validated merge base and semantic manifest parsing (selected).

Shared comparison helpers now inspect the whole PR, explicit push before/after commits, main merge first-parent changes and genuine initial trees. Git errors are fatal. Rename handling considers relevant old and new paths. Rust paths cover every workspace member; JavaScript types/config/locks and shared CI files trigger their applicable checks. Version guards compare parsed JSON/TOML version fields across root, workspace and member manifests. New fragment requirements use genuine added paths; editing, deleting or renaming an existing fragment does not satisfy them. Semantic guards allow formatting and remove branch-name exceptions.

The baseline's five JavaScript failures, Rust git fixtures and semantic guard fixtures are preserved under `verification/`. Tests include earlier-commit changes, declarations, invalid refs, empty diffs, formatting-only edits, workspace members and renamed fragments.

Final review added isolated one-commit regressions for each top-level JS tool configuration, Changesets configuration, shared Git hooks and guard experiments. These paths previously left all relevant validation flags false. Both language detectors now recognize shared hooks/experiments, JS recognizes package/tool configuration, and the workflow-validation triggers include Git hooks. `config-detection-before.log` and `rust-hook-detection-before.log` preserve the failures; corresponding after logs pass.

### 4. Silent helper output and changeset parsing failures

Cause: JavaScript changeset merging warned and skipped malformed fragments, potentially consuming valid data alongside an invalid fragment while returning success. Several Rust helpers warned when GITHUB_OUTPUT could not be written, leaving downstream decisions empty and green.

Options considered: add log warnings only (still false success); make failures fatal before changing release data and centralize output writing (selected).

Malformed changesets now stop the merge before output mutation. Rust fragment and file-size helpers also treated unreadable inputs as empty or healthy; bounded file/directory fixtures reproduced both false successes, and read/traversal errors now fail. All six affected Rust producers use `github-output.rs`: unset output supports local execution, configured output must be writable, and open/write errors are fatal. Code comparisons show the JavaScript template already fixed malformed fragments; the Rust template still reproduces warning-only output failure. [Upstream issue 192](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/issues/192) includes the pinned reproduction, workaround and shared-helper proposal.

The standalone Rust changelog collector also swallowed directory-read and fragment-removal errors, reporting completion with consumed fragments still present. A filesystem-error unit test fails before the repair (`fragment-cleanup-before.log`) and passes afterward; cleanup errors now stop the helper with the failed path and OS error. This test runs with every helper in CI.

The same ignored cleanup errors were confirmed in the pinned Rust template and reported with a portable test, workaround and suggested error propagation in [issue 192's follow-up](https://github.com/link-foundation/rust-ai-driven-development-pipeline-template/issues/192#issuecomment-6059288437).

### 5. Missing validation, false-green checks and noisy tools

Cause: `npm ci || npm install` concealed lock mismatches; invalid duplication format could scan no files and pass; lint warnings were allowed; the deprecated React test renderer emitted warnings; workflows and release helpers were not themselves comprehensively checked; dependency audits, secrets scanning and full terminal gates were absent.

Plan: strict lock installation; zero-warning ESLint and Clippy; actual JS/TS/bash duplication scanning with `failOnEmpty`; compile/test every executable Rust helper with warnings denied; actionlint with ShellCheck/Pyflakes, zizmor annotations and permission review; committed dependency audit policy; local secretlint; and a terminal gate listing every job. Unknown/failed/timed-out results fail. Intentional skips pass, while a cancelled check is excused only when it is explicitly read-only and GitHub's branch head proves it has been superseded. Cancelled writers always fail.

The duplication threshold is the template's explicit 10% policy. The prior 0% value was attached to a nonfunctional `console` format, so it was not an established working zero-duplication guarantee. The repaired check scans 65 files and reports 4.31%, primarily test and CLI boilerplate; comments are excluded using the template's weak mode. Empty scans now fail.

Changesets 3.0.3 and jscpd 5.4.0 resolve the audited development dependency findings; the committed lock audit reports zero vulnerabilities after the original 21. Node 24 is used for development tooling; published JS engines remain Node >=20. React tests use Testing Library/JSDOM and retain assertions without the deprecated renderer. Public async API behavior is preserved with a narrow explained `require-await` exception. Resolver and CLI functions were simplified to meet the existing complexity policy.

Fresh Windows Node/Deno CI additionally emitted DEP0190 from the npm package dry-run test's shell-plus-argument-array invocation (`javascript-37769807872.log:2207` and `:4841`). The real test is replayed through its Windows branch on Linux with `--throw-deprecation`; it fails before and passes after using one fixed command string. This preserves Windows shim support without unsafe argument concatenation. The normal Node test command now treats deprecations as errors; no warning is suppressed.

Successful Security runs also exposed incomplete Rust semantic coverage: twenty standalone helper/module files had no Cargo source graph, so CodeQL skipped their macro expansion. A separate analysis-only manifest now includes all seventeen helper binary targets and their embedded dependencies; an actual Cargo metadata regression verifies the complete set, and fresh extractor logs confirm both manifests load without warnings. Online zizmor receives the read-only job token and fails input-collection errors. Optional OpenSSF aggregate health-score annotations introduced by this PR are omitted because they do not establish a vulnerability in the locked package; required high-severity dependency review and both language audits remain. Detailed warning lines, reproductions and fresh run identities are in [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md).

The evidence collector itself matched its generated run index with `pr-run-*.json`, then deleted that index when bundling a second time. Numeric run-name matching repairs repeated collection without losing any original run record. The before/after integrity regression and required CI checksum check verify every bundled member, retained log and expired-download error.

An additional successful run exposed six false error annotations: negative guard tests reprinted their expected `::error::` diagnostics to the runner. The check-run API and complete Rust log confirm they belong to passing regression tests. Options were to disable workflow-command processing around the entire step or render captured fixture messages as plain text; the latter preserves normal runner behavior and production guards' genuine annotations. All five CI fixtures now render their captured diagnostics without command delimiters. `issue-23-ci-annotations.py` executes the actual fixtures, verifies their exit status and rejects emitted workflow commands; it fails before the change and passes afterward. GitHub's macOS capacity and link-report messages were separately verified as informational notices, with no warning/failure severity.

### 6. Permissions, source validation, recovery and documentation writers

Cause: broad workflow write/OIDC permissions, interpolated dispatch values in shell code, stale unchecked writer trees, unpinned remote helper evaluation and language-specific Pages writers exposed avoidable failure modes. Independent docs publishers could erase the other language site.

Plan: read-only defaults; permissions and secrets scoped to the jobs/steps that need them; environment variables for shell inputs; immutable third-party action/tool pins; current supported OS images; metadata-only synchronization from the tested checkout; and complete combined-site publication from either language workflow. Manual instant release still requires all package prerequisites; manual fragment-PR creation is retained. `js.yml` keeps its filename for npm trusted-publisher identity.

The npm MODULE_NOT_FOUND recovery feature is preserved, using a bounded fetched npm archive verified against registry SHA-512 integrity before extraction and restoring backup state if validation fails. It no longer evaluates unpinned remote JavaScript. Its bad-integrity regression fails before executing commands.

Both Pages writers build the JS site, Rust site and rustdoc and assemble `site/` with JS at the root and Rust under `rust/`. Workflow validation checks every terminal job, timeout, cancellation role and checkout credential policy. Action upgrades replace deprecated runner tooling rather than suppressing runtime warnings.

### 7. External links and publish capability limits

The template's tested link recheck helper and regression suite were reused. It retries bounded connection resets/timeouts/429/5xx and validates the complete original report before setting `all_recovered`. A remaining 404 or local broken link cannot be excused by another recovered URL. Pull requests fail on unrecovered product links; main records changed external-world failures as warnings while internal checks remain strict. Historical case-study evidence is excluded from live link health, following the template's policy. Local current product links pass.

Credential preflights run before expensive release work and again inside the writer. Crates preflight uses an intentionally invalid bounded payload to check authentication/publish scope without publishing content. npm OIDC preflight verifies job token wiring, npm/Node support and configuration availability; `whoami` is deliberately not treated as proof of write permission. npm offers no harmless API that fully proves the package's trusted-publisher binding or stage-approval permission. Exact visibility and real publish errors therefore remain mandatory final evidence. No actual release is attempted from this PR branch.

## All 17 CI/CD principles

| # | Principle | Implementation |
| --- | --- | --- |
| 1 | Relevant changes only | Whole-event JS/Rust detection, member/config/lock/shared workflow paths and workflow path filters |
| 2 | File size limits | Shared tracked-code 1500-line ceiling, warnings at 1350, JS wrapper and Rust checks; archived evidence excluded |
| 3 | Automated formatting | Prettier/rustfmt and optional local pre-commit hook |
| 4 | Static analysis and linting | ESLint max warnings 0; Rust Clippy/helper compilation deny warnings; types; real duplication scans |
| 5 | Fast-fail ordering | Credential and cheap guard prerequisites before test/build/package/release |
| 6 | Changeset versioning | Required genuine new JS/Rust fragments, semantic protected versions, fragments consumed only on successful release preparation |
| 7 | Validate actual merge | Fresh merge simulation before validation; release synchronization limited to metadata from the validated SHA |
| 8 | Pre-commit hooks | `.githooks/pre-commit`, documented installation, formatting/static/types/size/secrets checks |
| 9 | Release automation | Preserved automatic and both manual modes; one publisher; finite verified registry readback; language-specific release tags |
| 10 | Concurrency | Cancellable read jobs; one cross-workflow noncancellable writer group; clean synchronization and classified push retry |
| 11 | Secrets detection | Lock-managed secretlint scans product, tests, hooks, CI scripts and workflow code before release |
| 12 | Documentation validation | Required docs/size checks; both generated sites and rustdoc; complete combined Pages artifact |
| 13 | Native architecture container builds | No Dockerfile, active container workflow or product container contract exists. Preserve the reusable Docker publishing action, add GHA layer caching and an optional platform matching its caller's native runner; do not invent a container release for a library. |
| 14 | Workflow linting | Separate Workflows pipeline: digest-pinned actionlint with ShellCheck/Pyflakes, policy checker, zizmor with GitHub annotations and reviewed permissions |
| 15 | Dependency audit | Committed npm lock audit/high threshold, Cargo audit denying warnings, PR dependency review and scheduled security scans |
| 16 | Prove publish capability early | Conditional main preflights, environment-scoped crates credentials, writer recheck and explicit npm OIDC proof limitations |
| 17 | Distinguish broken pipeline from changed world | Deterministic checks remain fatal; bounded live-link retries; complete report gate; main-only external-link warning policy |

All eight release/deployment writers use one noncancellable `queue: max` group. GitHub's default single-pending queue replaces a pending job when another arrives, which can discard required release work. Repository policy rejects that configuration and incompatible cancellation. A narrowly scoped actionlint exception accommodates the released validator's older schema while retaining all other validation; primary documentation and upstream reports are recorded in [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md).

## Diagnostics and unresolved external facts

`DEBUG=1` enables git comparison choices, metadata synchronization and registry URL/status/schema details without exposing authorization tokens. `PIPELINE_STATUS_VERBOSE=1` shows gate results and superseded-head classification. Both default off. Error paths retain underlying command/HTTP context even without verbose mode.

Historical npm stage approval cannot be established from the available logs or a public registry query. Expired May logs cannot be recovered by repeated downloads. The safe response to both limits is to preserve provenance, state uncertainty and fail when required visibility or valid state is missing. Staged publication may require a maintainer's 2FA approval through npm; no CI retry or OIDC request can substitute for that account requirement.

zizmor's auditor persona also emits informational suggestions to replace maintained pinned setup actions with raw runner commands and low-confidence artifact credential findings on Git-writing jobs. The per-finding review is preserved under `research/`; these writers deliberately retain credentials to push, and never upload their checkout. Read-only/artifact jobs disable persistence. These reviewed findings are not hidden by global rule suppression.

## Verification and reproducibility

Representative commands from the repository root:

```bash
(cd js && npm ci && npm run check && npm test && npm run test:types)
(cd js && bun test && deno test --no-check --allow-read --allow-env --allow-run --allow-write tests/)
(cd js && npm run test:browser && npm run lint:secrets && npm audit --audit-level=high)
cargo test --locked --manifest-path rust/Cargo.toml --workspace --all-targets --all-features
cargo clippy --locked --manifest-path rust/Cargo.toml --workspace --all-targets --all-features -- -D warnings
RUST_LOG=error bash rust/scripts/check-scripts.sh
python3 experiments/issue-23-rust-release.py
python3 experiments/issue-23-rust-guards.py
python3 experiments/issue-23-rust-output.py
python3 experiments/issue-23-shared-guards.py
node --test scripts/*.test.mjs
python3 scripts/check-ci-policy.py
actionlint -ignore 'unexpected key "queue" for "concurrency" section'
```

Exact local commands and before/after outcomes are in `verification/`. Python policy validation requires the pinned `scripts/requirements-ci.txt`. The runtime matrix retains Node, Bun and Deno on Linux/macOS/Windows; browser integration uses real Playwright Chromium. Product tests are unchanged in purpose and release fixtures exercise actual helpers with isolated Git repositories.

The final CI record compares run timestamps and head SHAs to pushed commits, downloads nonpassing logs, documents any additional failures and records latest-SHA results. A successful PR validates code and pipeline definitions; protected main-only publication, account-side npm approval and production deployment are intentionally not executed from a pull request.
