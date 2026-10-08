# Final verification

## Local checks

| Area | Result | Evidence |
| --- | --- | --- |
| JS | 61 tests pass on Node 22.23.3 and 24.21.0; types, lint, format, duplication, secrets and pack dry-run pass; `npm outdated` is empty | `verification/after-js-test-node-*.log`, `verification/after1-*.log` |
| Rust | fmt, Clippy (`-Dwarnings`), tests and doctests pass on stable 1.99 and the MSRV 1.87; 1.85 and 1.86 fail as documented | `verification/after-rust-*.log` |
| rust-script helpers | 16 standalone helpers (plus the 4 shared modules they include) are formatted, checked and tested with `-Dwarnings` at the raised floors | `verification/after-rust-check-scripts.log`, `verification/after-rust-script-floors.log` |
| Workflows | CI policy, line limits, docs, pin guard, actionlint (with `.github/actionlint.yaml`) and zizmor (default and pedantic) pass | `verification/after-actionlint.log`, `verification/after-zizmor*.log` |
| Audits | `npm audit`: 0 vulnerabilities. `cargo audit`: no advisories in `rust/Cargo.lock` or the helper lock trees. `pip-audit`: no known vulnerabilities | `verification/after-npm-audit.log`, `verification/after-cargo-audit.log`, `verification/after-pip-audit.log` |
| Freshness | Re-checked at 15:02 UTC against npm, crates.io (`cargo update --dry-run` locks 0 packages), PyPI and the GitHub releases of every action and tool: nothing newer | `verification/final-registry-recheck.log` |

## CI on PR 27

| Commit | Documentation | JavaScript | Rust | Security | Workflows |
| --- | --- | --- | --- | --- | --- |
| `d612a29` (resolver 3, minor changeset) | [37795617465](https://github.com/link-foundation/lino-i18n/actions/runs/37795617465) success | [37795617387](https://github.com/link-foundation/lino-i18n/actions/runs/37795617387) success | [37795617481](https://github.com/link-foundation/lino-i18n/actions/runs/37795617481) success | [37795617430](https://github.com/link-foundation/lino-i18n/actions/runs/37795617430) success | [37795617321](https://github.com/link-foundation/lino-i18n/actions/runs/37795617321) success |
| `7d0cedd` (rust-script floors; last code commit) | [37796450346](https://github.com/link-foundation/lino-i18n/actions/runs/37796450346) success | [37796449941](https://github.com/link-foundation/lino-i18n/actions/runs/37796449941) success (attempt 2) | [37796450246](https://github.com/link-foundation/lino-i18n/actions/runs/37796450246) success | [37796449969](https://github.com/link-foundation/lino-i18n/actions/runs/37796449969) success | [37796450120](https://github.com/link-foundation/lino-i18n/actions/runs/37796450120) success |

`ci-logs/` has the complete logs for each commit (`pr-27-<sha>-logs.tar.gz`), a manifest with byte counts and SHA-256 per log (`manifest-<sha>.json`), and every check-run annotation (`annotations-<sha>.txt`).

- **Runner capacity on attempt 1:** in the first attempt of JavaScript run 37796449941, `Test (deno on macos-26)` never started. It sat queued from 14:56 to 15:11 UTC with no runner and no steps, then failed with "The job was not acquired by Runner of type hosted even after multiple attempts". Pipeline Status reported it as `abandoned`.
  - This was GitHub-hosted capacity, not this change. The Node, Bun and Rust jobs on macos-26 passed in the same runs. GitHub's notice concerns macOS arm64 runners in general, and macos-15 is arm64 too.
  - `gh run rerun --failed` ran it as attempt 2, and every job passed. The evidence is in `ci-logs/js-37796449941-attempt1-runner-not-acquired.txt`.
- **Annotations:** at notice level only on the final attempts. They are GitHub's macOS arm64 capacity notice and the lychee summary link. No warning or failure annotations.
- **Log scan:** in every archived log, for both commits, there are no `##[warning]` or `##[error]` commands, no rustc `warning:` lines and no `npm warn` lines.
- **"DEPRECATED" matches:** the only hits are the CodeQL CLI's own option schema dumped by `codeql-action/init`, which describes a flag this repository doesn't pass. Node tests run with `--throw-deprecation`, so any runtime deprecation would fail them.
- **Test legs:** all 11 JS test jobs pass: Node 24.x, Bun and Deno on ubuntu-26.04, macos-26 and windows-2025, plus Node 22.x (the floor) and 26.x on Ubuntu. So do the three Rust OS jobs and the Rust 1.87 MSRV leg.

## Not exercised by CI

- `.github/actions/publish-dockerhub/action.yml` is called by no workflow. Its `docker/*` actions are already at their latest majors, and Dependabot's `/.github/actions/*` entry and the pin guard cover it.
- The protected release jobs (npm and crates.io publication, Pages deployment) only run on `main`. They are skipped on this PR branch, as in every PR.

## Evidence commit `0d3017b`: Windows checkout failure and fix

- **What happened:** the first evidence commit named six local logs after their npm scripts, for example `verification/after1-check:duplication.log`.
- **Why it failed:** Windows doesn't allow `:` in file names. `actions/checkout` failed with `error: invalid path 'dev/log/issues/26/pulls/27/verification/after1-check:duplication.log'` in every windows-2025 job: [JavaScript 37799669177](https://github.com/link-foundation/lino-i18n/actions/runs/37799669177) (Node, Bun and Deno) and [Rust 37799669184](https://github.com/link-foundation/lino-i18n/actions/runs/37799669184). Pipeline Status reported the failed `test` job in both.
- **Unaffected:** Documentation, Security and Workflows passed, and so did every Linux and macOS job.
- **Evidence:** the failed-job logs are in `ci-logs/pr-27-0d3017b-failed-logs.tar.gz`, with checksums in `ci-logs/pr-27-0d3017b-failed-logs.sha256`.
- **Fix:** the next commit renames the six files, replacing `:` with `-`, and `git ls-files | grep ':'` is now empty. The windows-2025 checkout in PR CI is the regression check: it fails on any path Windows can't create. At `8bce350`, every windows-2025 job checks out and passes.

## macOS runner acquisition

GitHub never assigned a runner to some macos-26 jobs. Each sat queued for 15 minutes with no steps and was then cancelled with "The job was not acquired by Runner of type hosted even after multiple attempts":

- **7d0cedd:** 1 job, `Test (deno on macos-26)`.
- **8bce350:** 2 jobs, `Test (node 24.x on macos-26)` and `Test (bun on macos-26)`.

Evidence for each is in `ci-logs/js-*-attempt1-runner-not-acquired.txt`. Re-running only the failed jobs (`gh run rerun --failed`) is the remedy.

Why this isn't caused by the change:

- No job code ran, and the other macos-26 jobs of the same runs passed.
- githubstatus.com listed no incident.
- Users have reported the same cancellation since 2026-10-05 for ubuntu and windows jobs too ([smormah/vsift#316](https://github.com/smormah/vsift/issues/316), [ShaulLavo/mesh#253](https://github.com/ShaulLavo/mesh/issues/253), [Cratis/Chronicle.Go#74](https://github.com/Cratis/Chronicle.Go/issues/74)).
- GitHub's notice is about macOS arm64 capacity in general, and that pool includes macos-15.
- `macos-latest` already resolves to macos-26, so the label is kept.

Limit: earlier today, the macos-15 runs on main and issue 23 (24 jobs) were all assigned a runner. These samples can't separate peak-hour load from a smaller macos-26 pool.
