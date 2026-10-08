Fixes #26.

This brings every dependency in every ecosystem of the repository up to its latest version and adds Dependabot so the drift does not build up again. Each value was resolved from its registry on 2026-10-08. Items that can't move have a written reason.

The full [requirement matrix, per-ecosystem before/after tables, majors crossed and left-behind reasons](https://github.com/link-foundation/lino-i18n/blob/issue-26-f68d85bd297d/dev/log/issues/26/pulls/27/ANALYSIS.md), the [primary sources](https://github.com/link-foundation/lino-i18n/blob/issue-26-f68d85bd297d/dev/log/issues/26/pulls/27/SOURCES.md), registry snapshots, before/after logs and archived CI logs are committed under `dev/log/issues/26/pulls/27/`.

## What changed

| Ecosystem | Change |
| --- | --- |
| JavaScript | `npm-check-updates -u` and a lockfile regenerated from scratch. links-notation 0.13 → 0.23, lino-objects-codec 0.4 → 0.9, plus @playwright/test, @types/node, @types/react, eslint, eslint-plugin-prettier, prettier and react. `engines.node` goes from `>=20.0.0` to `>=22.11.0`: lino-objects-codec 0.9 requires it, and Node 20 reached end of life on 2026-04-30. CI tests Node 22.x (the floor), 24.x and 26.x. `npm outdated` is empty |
| Rust | Edition 2021 → 2024; `rust-version` 1.75 → 1.87, the measured minimum (1.85/1.86 fail inside links-notation 0.23); resolver 2 → 3 (MSRV-aware). lino-objects-codec 0.2 → 0.8, syn 2 → 3, and proc-macro2/quote floors at the resolved versions. Every `Cargo.lock` entry is at its latest version. A new Rust 1.87 CI leg tests the MSRV |
| rust-script helpers | ureq 2 → 3 in four helpers (the new config, header, error and body API). toml 0.8 → 1 in `check-version-modification.rs`: the old `Value` parsing idiom still compiles under toml 1 but rejects every manifest at runtime, so it now parses a `toml::Table` and has a unit test. All `//!` cargo floors equal the resolved versions |
| Python | PyYAML is already at the latest 6.0.3. The policy job now pins CPython 3.14 through `actions/setup-python@v7` |
| GitHub Actions | checkout, setup-node and upload-artifact v6 → v7. install-action moves to v2.87.26 and Deno to 2.9.7. Every hash pin carries its version comment. Runners: ubuntu-24.04 → ubuntu-26.04 and macos-15 → macos-26 (windows-2025 is already the newest). `.github/actionlint.yaml` declares ubuntu-26.04 because actionlint 1.7.12 predates it |
| Automation | `.github/dependabot.yml` covers npm `/js`, cargo `/rust` (the workspace root also fetches both members and the lock), pip `/scripts`, and github-actions `/` plus `/.github/actions/*`. Updates run weekly, grouped per ecosystem, with a 7-day cooldown that zizmor now audits. `scripts/check-dependency-pins.py` runs in the Workflows policy job and fails if an action or tool is pinned at two versions, or if the MSRV or Node floor leg is missing |
| Release | JS changeset (minor, because the supported Node range shrinks) and Rust changelog fragment (minor) |

## Left behind, with reasons

- **npm recovery pin (stays on 11.21.0; npm 12.2.0 exists):** every supported Node line bundles npm 11, and trusted publishing only needs 11.5.1+.
- **lino-arguments (stays on 0.3.0, the latest on npm):** its 0.4.0 release failed upstream, so its links-notation 0.11 / yargs 17 subtree stays. Reported as [lino-arguments#41](https://github.com/link-foundation/lino-arguments/issues/41).
- **61 transitive npm majors:** their parents are already at their latest versions and exclude the new majors.
- **actionlint workarounds:** a label entry for ubuntu-26.04 (rhysd/actionlint#682) and the existing `queue` ignore (rhysd/actionlint#657) stay until upstream releases a fix.
- **MSRV:** links-notation doesn't declare its real MSRV. Reported as [links-notation#334](https://github.com/link-foundation/links-notation/issues/334).
- **Hand-written `.lino` catalogue parsers:** they stay. The experiments show that `parseIndented`, `decode` and the links-notation `Parser` don't preserve this dialect's escapes and `"""` blocks.

## Reproductions and verification

- `experiments/issue-26-toml-document-parse.rs` reproduces the toml 1 runtime defect, and a unit test in the helper covers it.
- `experiments/issue-26-ureq3-registry-state.rs` exercises the ureq 3 port against live crates.io.
- `experiments/issue-26-dependency-pins.py` proves that each kind of drift fails the new guard.
- Local runs are green:
  - 61 JS tests on Node 22 and 24, plus types, lint, format, duplication, secrets and pack.
  - Rust fmt, Clippy, tests and doctests on 1.87 and 1.99.
  - All 16 standalone rust-script helpers (with the shared modules they include) checked and tested with `-Dwarnings`.
  - Workflow policy, pin guard, actionlint and zizmor (pedantic).
- `npm audit`, `cargo audit` (including the helper lock trees) and `pip-audit` report no vulnerabilities.
- CI on every pushed commit passes all five workflows, with no warning or error annotations. The results and archived logs are in [FINAL-VERIFICATION.md](https://github.com/link-foundation/lino-i18n/blob/issue-26-f68d85bd297d/dev/log/issues/26/pulls/27/FINAL-VERIFICATION.md).
- The unused composite action `.github/actions/publish-dockerhub` is called by no workflow, so CI doesn't run it. Its docker actions are already at their latest majors.
