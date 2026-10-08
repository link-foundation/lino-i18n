# Evidence for issue 26 and PR 27

Start with [ANALYSIS.md](ANALYSIS.md). It has the requirement matrix, the per-ecosystem before/after tables resolved from the registries, the majors crossed, and everything left behind with a reason. [SOURCES.md](SOURCES.md) lists the primary sources, [PLAN.md](PLAN.md) the work plan, and [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md) the CI results.

| Folder | Contents |
| --- | --- |
| `github/` | Issue 26, PR 27 and all three comment collections, recent branch/main runs, related merged PRs, the original file tree |
| `registry/` | Registry answers captured on 2026-10-08: `npm-latest.txt`, `crates-latest*.txt`, `pypi-*.txt`, `github-actions-latest.txt` (tag + commit), Node/Python release schedules, Rust stable channel, and the before state (`ncu-before.txt`, `npm-outdated*-before.txt`, `cargo-lock-packages-before.txt`, `npm-audit-before.txt`) |
| `research/` | Hive-mind dependency-update practices (verbatim), Actions/toolchain notes, Rust and JS migration notes, ubuntu-26.04 image README, dependabot-core fetcher sources |
| `verification/` | `before-*` and `after*` logs for every build, test, lint and audit, MSRV probes (1.85/1.86 fail, 1.87 passes) and experiment outputs |
| `ci-logs/` | Complete PR CI logs bundled per commit with a checksum manifest; read one with `tar -xOzf ci-logs/pr-27-d612a29-logs.tar.gz rust-37795617481.log` |
| `upstream/` | Bodies of the blocker reports filed upstream and the failed upstream release log they cite |

The reproductions live in `experiments/issue-26-*`:

- `issue-26-toml-document-parse.rs` shows that toml 1 rejects the old manifest parsing idiom.
- `issue-26-ureq3-registry-state.rs` checks live crates.io visibility through ureq 3.
- `issue-26-dependency-pins.py` proves that each pin drift fails the new guard.
