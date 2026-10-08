# Issue 26 / PR 27 plan

- [x] Collect the issue, PR 27, every comment collection, recent runs and related merged PRs; read the referenced best-practices document.
- [x] Inventory every ecosystem and every place a version is pinned: npm, Cargo workspace and members, rust-script `//!` blocks, `scripts/requirements-ci.txt`, workflows, the composite action, tool versions, runner images, Node/Rust/Python toolchains, the npm recovery pin.
- [x] Capture the before state and resolve the latest version of each item from its registry before editing.
- [x] JS: `npm-check-updates -u`, regenerate the lockfile from scratch, fix the formatting the new prettier asks for, make `engines.node` honest and test its floor.
- [x] Rust: `cargo upgrade --incompatible`, `cargo update`, edition 2024, measure the real MSRV (1.84/1.85/1.86/1.87), test it in CI, resolver 3.
- [x] rust-script helpers: ureq 3 and toml 1 migrations with experiments and a unit test for the runtime defect; floors equal the resolved versions.
- [x] Python: confirm PyYAML is current; pin CPython 3.14 for the policy job.
- [x] Actions: newest release or major for each action, hash pins with version comments, newest runner images, actionlint label config.
- [x] Dependabot for all four ecosystems, with a cooldown and groups, audited by zizmor.
- [x] Guard against version drift: one version per action/tool, an MSRV leg and a Node floor leg (`scripts/check-dependency-pins.py`).
- [x] Evaluate upstream replacements for hand-rolled code and record the verdicts.
- [x] Run every local build, test, lint and audit (npm, cargo, pip, rust-script lock trees); keep the logs.
- [x] Report the blockers upstream: links-notation#334 (missing rust-version), lino-arguments#41 (failed 0.4.0 release).
- [x] Release triggers: JS changeset (minor) and Rust changelog fragment (minor).
- [x] Merge main, watch CI on the final SHA, archive the logs, update the PR description, mark it ready.

No background work or delegated agents are left running at completion.
