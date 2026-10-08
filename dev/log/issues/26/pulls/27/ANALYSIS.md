# Issue 26: update every dependency in every language

This investigation addresses [issue 26](https://github.com/link-foundation/lino-i18n/issues/26) in [PR 27](https://github.com/link-foundation/lino-i18n/pull/27). The baseline is `origin/main` at `6613b5d` ("chore: release rust-v0.3.0"). Every "latest" value below was resolved from the registry on 2026-10-08, not from memory. The raw responses are in `registry/`.

## Evidence and scope

- `github/` holds the issue, PR 27, PR conversation comments, inline review comments, reviews and recent branch/main runs. There were no issue or PR comments when the work finished.
- `research/` holds:
  - the referenced [hive-mind dependency-update best practices](research/hive-mind-DEPENDENCY-UPDATE-BEST-PRACTICES.md);
  - notes on the Actions and toolchain upgrades;
  - the Rust migration and JS Links Notation migration;
  - the ubuntu-26.04 runner image README;
  - the dependabot-core fetcher sources that show how `/rust` and `/scripts` are read.
- `verification/` holds every before/after command log. `upstream/` holds the two blocker reports filed upstream and the failed upstream release log.
- Experiments live in `experiments/issue-26-*`, use local fixtures and never publish anything.

Languages detected by GitHub: JavaScript, Rust, Python, Shell, TypeScript, HTML.

- **Shell:** the scripts in `.githooks/`, `scripts/*.sh` and `rust/scripts/check-scripts.sh` call only tools installed by the workflows (git, cargo, rustfmt, rust-script, node), so Shell has no dependencies of its own.
- **HTML:** pages are assembled by `scripts/assemble-docs.py` with no external assets.
- **Docker:** there is no Dockerfile or base image. `.github/actions/publish-dockerhub/action.yml` only references `docker/*` actions, which are already at their latest majors. No workflow calls it, so it doesn't run in CI, but Dependabot and the pin guard still cover it.

## Requirements and completion criteria

| ID | Requirement (issue text or requested investigation) | Solution and evidence |
| --- | --- | --- |
| R1 | JS/TS: `npx npm-check-updates -u && npm install`; regenerate and commit `js/package-lock.json` | `verification/ncu-upgrade.log`; lockfile regenerated from scratch (`npm-install-after.log`); `npm outdated` is empty (`after-npm-audit.log`) |
| R2 | Rust: `cargo upgrade --incompatible && cargo update`; revisit `edition` and `rust-version`; regenerate `rust/Cargo.lock` | All 3 manifests and the lock updated; edition 2021 → 2024; rust-version 1.75 → 1.87 (the measured minimum, see R9); resolver 2 → 3 |
| R3 | Python: update `scripts/requirements-ci.txt`; raise floors; drop upper bounds | PyYAML is already pinned `==6.0.3` = latest; there is no `pyproject.toml`; the CI interpreter is pinned to the newest CPython, 3.14 |
| R4 | GitHub Actions: bump every `uses:` in all workflows and composite actions | Every action is at its latest release or major (table below); runners ubuntu-24.04 → ubuntu-26.04 and macos-15 → macos-26 |
| R5 | Check whether Shell and HTML pull dependencies through another ecosystem | Neither does (see "Evidence and scope") |
| R6 | Add `.github/dependabot.yml` | npm `/js`, cargo `/rust`, pip `/scripts`, github-actions `/` and `/.github/actions/*`; weekly, grouped, with a 7-day cooldown |
| R7 | "All" is literal: dev deps, transitive lock entries, build plugins, test runners, linters, base images, actions, toolchains | Tables below cover direct, dev, transitive, rust-script helper deps, CI tools, runtimes and runners |
| R8 | Per-ecosystem table of the pinned vs latest version, resolved from the registry; a written reason for anything left behind | Tables below; the "Left behind" section |
| R9 | Cross majors deliberately: read changelogs and migration guides, adapt code, remove shims | syn 3, ureq 3, toml 1, edition 2024, lino-objects-codec 0.8/0.9, links-notation 0.23, checkout/setup-node/upload-artifact v7; see "Majors crossed" |
| R10 | Use new upstream features; delete hand-rolled copies | Evaluated; resolver 3 and the toml 1 `Table` API adopted; no upstream API replaces the `.lino` parser (see "Hand-rolled code") |
| R11 | Honest constraints: raise floors, drop upper bounds, commit lockfiles | Rust and rust-script floors equal the resolved versions; Node floor >=22.11.0 with a Node 22 CI leg; MSRV 1.87 with a 1.87 CI leg; both lockfiles committed |
| R12 | One version per dependency everywhere | `scripts/check-dependency-pins.py` fails CI on any action or tool pinned at two versions, a missing MSRV leg or a missing Node-floor leg; `experiments/issue-26-dependency-pins.py` proves each drift is rejected |
| R13 | Full build/test/lint of every ecosystem; green CI; no new deprecation warnings | `verification/after*` logs; CI results in [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md) |
| R14 | No unresolved advisories (`npm audit`, `cargo audit`, `pip-audit`) | `after-npm-audit.log` 0, `after-cargo-audit.log` 0, `after-pip-audit.log` none; the rust-script helper trees are also audited (`research/rust-deps-migration.md`) |
| R15 | Follow the hive-mind dependency-update practices | Principle matrix below |
| R16 | Everything in this single PR | PR 27 only |
| R17 | Collect data in this folder; deep analysis; online research; existing components; apply everywhere | This folder, [SOURCES.md](SOURCES.md) and the per-place tables |
| R18 | Prepare the release (repository convention) | `js/.changeset/issue-26-dependencies.md` (minor: the supported Node range shrinks) and a `rust/changelog.d` fragment (minor) |

## JavaScript / TypeScript (`js/package.json`, `js/package-lock.json`)

| Section | Package | Before | After | Installed | Registry latest |
| --- | --- | --- | --- | --- | --- |
| dependencies | links-notation | ^0.13.0 | ^0.23.0 | 0.23.0 | 0.23.0 |
| dependencies | lino-arguments | ^0.3.0 | ^0.3.0 | 0.3.0 | 0.3.0 |
| dependencies | lino-objects-codec | ^0.4.0 | ^0.9.0 | 0.9.0 | 0.9.0 |
| devDependencies | @changesets/cli | ^3.0.3 | ^3.0.3 | 3.0.3 | 3.0.3 |
| devDependencies | @eslint/js | ^10.0.1 | ^10.0.1 | 10.0.1 | 10.0.1 |
| devDependencies | @playwright/test | ^1.63.0 | ^1.64.0 | 1.64.0 | 1.64.0 |
| devDependencies | @secretlint/secretlint-rule-preset-recommend | ^13.0.7 | ^13.0.7 | 13.0.7 | 13.0.7 |
| devDependencies | @testing-library/react | ^16.3.3 | ^16.3.3 | 16.3.3 | 16.3.3 |
| devDependencies | @types/node | ^26.1.1 | ^26.6.4 | 26.6.4 | 26.6.4 |
| devDependencies | @types/react | ^19.2.17 | ^19.3.0 | 19.3.0 | 19.3.0 |
| devDependencies | esbuild | ^0.28.2 | ^0.28.2 | 0.28.2 | 0.28.2 |
| devDependencies | eslint | ^10.4.0 | ^10.12.0 | 10.12.0 | 10.12.0 |
| devDependencies | eslint-config-prettier | ^10.1.8 | ^10.1.8 | 10.1.8 | 10.1.8 |
| devDependencies | eslint-plugin-prettier | ^5.5.5 | ^5.5.6 | 5.5.6 | 5.5.6 |
| devDependencies | jscpd | ^5.4.0 | ^5.4.0 | 5.4.0 | 5.4.0 |
| devDependencies | jsdom | ^30.1.2 | ^30.1.2 | 30.1.2 | 30.1.2 |
| devDependencies | prettier | ^3.8.3 | ^3.9.9 | 3.9.9 | 3.9.9 |
| devDependencies | react | ^19.1.1 | ^19.3.0 | 19.3.0 | 19.3.0 |
| devDependencies | secretlint | ^13.0.7 | ^13.0.7 | 13.0.7 | 13.0.7 |
| devDependencies | test-anywhere | ^0.9.1 | ^0.9.1 | 0.9.1 | 0.9.1 |
| devDependencies | typescript | ^7.0.2 | ^7.0.2 | 7.0.2 | 7.0.2 |
| peerDependencies | react (optional) | >=18.0.0 | >=18.0.0 | — | 19.3.0 |
| engines | node | >=20.0.0 | >=22.11.0 | CI: 22.x, 24.x, 26.x | 26.11.1 |
| tooling | npm (`NPM_RECOVERY_VERSION`) | 11.x recovery pin | 11.21.0 | — | 12.2.0 (left behind, see below) |

- **Transitive entries:** the lockfile was regenerated from an empty tree. In `verification/after1-npm-outdated-all.txt`, every installed transitive package has Current = Wanted: each one is the newest version its parent's range allows.
  - 61 transitive packages have a newer major that a parent excludes. Examples: `@babel/code-frame` 7 via `@testing-library/dom`, and `@keyv/bigmap` via `@cacheable/memory`.
  - Those parents are already at their latest versions, so the only way forward is upstream. That is not something this repository can force without overrides that the parents don't support.
  - `MISSING` rows are optional platform binaries (esbuild, typescript, jscpd) and optional peers (`@dotenvx/dotenvx`, `canvas`, `jiti`), which npm doesn't install.
- **Node floor:** lino-objects-codec 0.9.0 declares `engines.node >=22.11.0`. Node 20 reached end of life on 2026-04-30 (`registry/node-release-schedule.txt`). The old `>=20.0.0` was therefore false. CI now tests the floor line (22.x), the active LTS (24.x) and the current line (26.x).

## Rust (`rust/Cargo.toml`, two member manifests, `rust/Cargo.lock`)

| Place | Item | Before | After | Registry latest |
| --- | --- | --- | --- | --- |
| workspace | edition | 2021 | 2024 | 2024 (newest edition) |
| workspace | rust-version | 1.75 | 1.87 | stable 1.99.0 (`registry/rust-stable-channel.txt`); 1.87 is the measured minimum |
| workspace | resolver | 2 | 3 | 3 |
| lino-i18n | lino-objects-codec | 0.2.1 | 0.8.0 | 0.8.0 |
| lino-i18n-macros | lino-objects-codec | 0.2.1 | 0.8.0 | 0.8.0 |
| lino-i18n-macros | proc-macro2 | 1 (lock 1.0.106) | 1.0.107 | 1.0.107 |
| lino-i18n-macros | quote | 1 (lock 1.0.45) | 1.0.47 | 1.0.47 |
| lino-i18n-macros | syn (`full`) | 2 (lock 2.0.117) | 3.0.6 | 3.0.6 |
| Cargo.lock (transitive) | links-notation | 0.13.0 | 0.23.0 | 0.23.0 |
| Cargo.lock (transitive) | links-notation-macro | — | 0.1.0 | 0.1.0 |
| Cargo.lock (transitive) | base64 | 0.22.1 | 0.23.1 | 0.23.1 |
| Cargo.lock (transitive) | memchr | 2.8.0 | 2.8.3 | 2.8.3 |
| Cargo.lock (transitive) | nom | 8.0.0 | 8.0.0 | 8.0.0 |
| Cargo.lock (transitive) | unicode-ident | 1.0.24 | 1.0.26 | 1.0.26 |

Every lock entry is at the registry's latest version (`registry/crates-latest*.txt`).

**Why the MSRV is exactly 1.87** (logs in `verification/`):

- Rust 1.84 can't parse the codec's edition 2024 manifest.
- 1.85 and 1.86 fail on `links-notation-0.23.0/src/quotes.rs:131` with `use of unstable library feature unsigned_is_multiple_of` (`after-rust-msrv-1.86-fails.log`).
- 1.87 passes (`after-rust-msrv-1.87.log`).
- links-notation doesn't declare a `rust-version`, so this was reported upstream as [links-notation#334](https://github.com/link-foundation/links-notation/issues/334).

### rust-script helpers (`rust/scripts/*.rs`, ``//! ```cargo`` blocks)

| Crate | Helpers | Before | After | Resolved / registry latest |
| --- | --- | --- | --- | --- |
| regex | 10 | "1" | "1.13.1" | 1.13.1 |
| serde_json | 5 | "1" | "1.0.151" | 1.0.151 |
| ureq | 4 | "2" | "3.4.2" | 3.4.2 |
| serde (`derive`) | 3 | "1" | "1.0.229" | 1.0.229 |
| chrono | 3 | "0.4" | "0.4.45" | 0.4.45 |
| toml | 1 | "0.8" | "1.1.7" | 1.1.7 |
| walkdir | 1 | "2" | "2.5.0" | 2.5.0 |

- Every helper declares the same requirement string for a crate, and `scripts/prepare-codeql-rust.py` rejects conflicting declarations.
- All 16 checked helpers compile and test with `-Dwarnings` (`after-rust-check-scripts.log`, `after-rust-script-floors.log`).

## Python (`scripts/requirements-ci.txt`)

| Item | Before | After | Registry latest |
| --- | --- | --- | --- |
| PyYAML | ==6.0.3 | ==6.0.3 | 6.0.3 (`registry/pypi-pyyaml.txt`) |
| CPython for the policy job | runner default (3.12 on ubuntu-24.04) | 3.14 via `actions/setup-python@v7` | 3.14.8 (`registry/python-eol.txt`) |
| zizmor (pipx) | 1.30.1 | 1.30.1 | 1.30.1 |
| pip-audit (local audit only) | — | 2.10.1 | 2.10.1 |

PyYAML has no dependencies of its own, and there is no `pyproject.toml` with floors to raise.

## GitHub Actions, runners and CI tools

| Action / tool | Uses | Before | After | Latest release |
| --- | --- | --- | --- | --- |
| actions/checkout | 40 | v6 | v7 | v7.0.1 |
| actions/setup-node | 21 | v6 | v7 | v7.1.0 |
| actions/upload-artifact | 2 | v6 | v7 | v7.0.2 |
| actions/setup-python | 1 | — | v7 | v7.0.0 |
| actions/configure-pages | 2 | v6 | v6 | v6.0.0 |
| actions/upload-pages-artifact | 2 | v5 | v5 | v5.0.0 |
| actions/deploy-pages | 2 | v5 | v5 | v5.0.1 |
| actions/dependency-review-action | 1 | v5 | v5 | v5.0.0 |
| github/codeql-action init/analyze | 2 | v4 | v4 | v4.38.3 (no v5) |
| docker/setup-buildx, login, metadata, build-push | 1 each | v4, v4, v6, v7 | unchanged | v4.4.1, v4.6.0, v6.2.0, v7.4.0 |
| lycheeverse/lychee-action | 1 | v2 | v2 | v2.9.0 |
| dtolnay/rust-toolchain | 12 | `89b1218` | `89b1218 # stable` | head of the `stable` branch |
| Swatinem/rust-cache | 5 | `6323deb` | `6323deb # v2.9.2` | v2.9.2 |
| peter-evans/create-pull-request | 2 | `5f6978f` | `5f6978f # v8.1.1` | v8.1.1 |
| taiki-e/install-action | 1 | `e67fa11` | `f7e5d7c # v2.87.26` | v2.87.26 |
| oven-sh/setup-bun / Bun | 1 | `0c5077e` / 1.4.2 | `0c5077e # v2.2.0` / 1.4.2 | v2.2.0 / bun-v1.4.2 |
| denoland/setup-deno / Deno | 1 | `22d081f` / 2.9.6 | `22d081f # v2.0.5` / 2.9.7 | v2.0.5 / v2.9.7 |
| rhysd/actionlint (docker digest) | 1 | 1.7.12 | 1.7.12 | v1.7.12 |
| rust-script | 3 | 0.36.0 | 0.36.0 | 0.36.0 |
| cargo-audit | 1 | 0.22.2 | 0.22.2 | 0.22.2 |
| Node.js for CI jobs | — | 24.x | 24.x (+ 22.x and 26.x test legs) | 26.11.1 |
| Linux runner | 38 jobs | ubuntu-24.04 | ubuntu-26.04 | ubuntu-26.04 |
| macOS runner | 2 matrices | macos-15 | macos-26 | macos-26 |
| Windows runner | 2 matrices | windows-2025 | windows-2025 | windows-2025 (= windows-latest) |

- Hash pins stay hash pins, with the version as a comment, because `.github/zizmor.yml` requires them for third-party actions.
- `actions/*`, `github/*`, `docker/*` and `lycheeverse/*` follow GitHub's major-tag policy.
- Full details are in `research/github-actions-and-toolchains.md`.

## Majors crossed and code adapted

| Upgrade | Migration source | Code change |
| --- | --- | --- |
| syn 2 → 3 | syn 3 release notes | None needed: the macro uses `parse_macro_input!`, `LitStr` and `Ident`, which are unchanged. Clippy and tests pass on 1.87 and 1.99 |
| edition 2021 → 2024 | Rust 2024 edition guide; `cargo fix --edition` | No source changes; rustfmt's 2024 style edition reordered imports |
| lino-objects-codec 0.2 → 0.8 (Rust), 0.4 → 0.9 (JS) | Upstream changelogs (`research/rust-deps-migration.md`, `research/js-lino-deps-migration.md`) | Neither Rust nor JS imports the codec or links-notation any more (`git log -S lino_objects_codec`); they remain declared per issue #1 (`docs/case-studies/issue-1/README.md:50-51`). Stale JS comments that claimed the parser/CLI used them were corrected. The update is exercised by compiling the full tree on 1.87, 1.99 and Node 22/24/26 |
| ureq 2 → 3 | ureq 3 migration notes / docs.rs | Four helpers: `.timeout()`/`.set()` → `config().timeout_global()` and `header()`; `Error::Status(404, _)` → `Error::StatusCode(404)`; bodies via `body_mut().read_to_string()`. Live crates.io check: `experiments/issue-26-ureq3-registry-state.rs` |
| toml 0.8 → 1 | toml 0.9 changelog: `Value::from_str` parses a single value | `check-version-modification.rs` parses `toml::Table`. The old idiom compiled but rejected every manifest at runtime (`experiments/issue-26-toml-document-parse.rs`). New unit test covers package, workspace and malformed manifests |
| resolver 2 → 3 | Cargo reference, "Rust-version aware resolver" | Future `cargo update` stays compatible with rust-version |
| actions v6 → v7 | Action release notes | Inputs unchanged; npm recovery pin read from one exported constant |
| ubuntu-24.04 → 26.04, macos-15 → 26 | runner-images README | `.github/actionlint.yaml` declares `ubuntu-26.04`, because actionlint 1.7.12 predates it (rhysd/actionlint#682) |

## Hand-rolled code vs upstream features

- **`.lino` catalogue parser:** `js/src/catalogs.js` and `rust/lino-i18n/src/loader.rs` stay. Experiments in `research/js-lino-deps-migration.md` §3 show that:
  - `parseIndented` throws on the repository's own `locales/en.lino`;
  - `decode` flattens it;
  - `links-notation` `Parser` drops backslash escapes and the dedent of `"""` blocks, and would add about 104 KB to the platform-only browser bundle.

  The dialect is a tested format contract, so no upstream API replaces it 1:1.
- **`toml`:** the version reader now uses toml 1's document `Table` instead of value parsing.
- **Resolver 3:** replaces manually checking that `cargo update` respects the MSRV.
- **Dependabot:** replaces nothing hand-rolled, but adds the missing automation.
- **`check-dependency-pins.py`:** new rather than replaced. Dependabot can't keep the rust-script blocks, tool versions or test legs in sync, and no upstream tool checks one-version-per-pin across workflows.

## Left behind, with reasons

| Item | Current | Latest | Reason and tracking |
| --- | --- | --- | --- |
| npm (`NPM_RECOVERY_VERSION`, `NPM_TARGET_MAJOR`) | 11.21.0 | 12.2.0 | The recovery path repairs the npm bundled with the runner's Node 24. Every supported Node line bundles npm 11, and npm 11.5.1+ is all trusted publishing needs. Moving the recovery major would install an npm that no tested Node ships. Revisit when a Node LTS bundles npm 12 |
| lino-arguments transitive tree (links-notation 0.11.x, yargs 17) | lino-arguments 0.3.0 | 0.3.0 on npm; source 0.4.0 unreleased | Upstream merged the bump (lino-arguments#38), but its JS release failed (`upstream/lino-arguments-release-37564452408-failed.log`). Reported as [lino-arguments#41](https://github.com/link-foundation/lino-arguments/issues/41); run `npm update lino-arguments` once 0.4.0 is published |
| 61 transitive npm majors | parent ranges | newer majors | Excluded by already-latest parents (see the JS section); `overrides` would run untested combinations |
| `@dotenvx/dotenvx` | not installed | 2.33.0 | Optional peer of lino-arguments 0.3.0; never loaded by this repository |
| Unused runtime deps links-notation, lino-objects-codec (JS and Rust) | kept, updated | — | Issue #1 requires lino-i18n to depend on the Links Notation packages. Removing them is a product decision outside this issue |
| actionlint diagnostics | 1.7.12 | 1.7.12 | Label config for ubuntu-26.04 (rhysd/actionlint#682) and the existing `queue` ignore (rhysd/actionlint#657) are needed until upstream releases |
| windows-2025 | windows-2025 | windows-2025 | Already the newest Windows image label |
| Dependabot coverage | — | — | Dependabot can't update rust-script `//!` blocks, `NPM_RECOVERY_VERSION` or tool versions passed to install actions. They are listed in the file's header comment, and `check-dependency-pins.py` keeps them consistent |

## Hive-mind principle matrix

| Principle | Application |
| --- | --- |
| 1. Table before changing anything | `registry/*-before.txt` and `verification/before-*.log` were captured before the first edit |
| 2. Written reason for anything left behind | Section above |
| 3. Cross majors deliberately | Majors table; runtime defect in toml 1 reproduced and tested |
| 4. Adopt new features / delete hand-rolled copies | Evaluated in "Hand-rolled code" |
| 5. Honest constraints | Floors = resolved versions; Node and MSRV floors tested in CI |
| 6. One version per dependency | `scripts/check-dependency-pins.py` in the Workflows policy job |
| 7. Update the toolchain | Edition, MSRV, resolver, Node lines, CPython, runners, Deno |
| 8. Green CI, zero new deprecations | [FINAL-VERIFICATION.md](FINAL-VERIFICATION.md) |
| 9. Audit what ships | npm, cargo (including helper lock trees) and pip audits are clean |
| 10. Report blockers upstream | links-notation#334, lino-arguments#41 |
| Keep current automatically | `.github/dependabot.yml` with 7-day cooldown (zizmor `dependabot-cooldown`) |

## Dependabot design vs the issue's suggestion

The issue suggested three cargo `directories` (`/rust`, `/rust/lino-i18n`, `/rust/lino-i18n-macros`). This PR uses `/rust` alone:

- dependabot-core's cargo file fetcher (`research/dependabot-core/cargo-file_fetcher.rb`) reads workspace members from the root manifest and updates the single `Cargo.lock`.
- Listing the members separately would open duplicate PRs for the same lock.

`github-actions` uses `directories: [/, /.github/actions/*]` so the composite action is covered explicitly. Groups keep each ecosystem in one weekly PR.

## Timeline

| Time (UTC, 2026-10-08) | Event |
| --- | --- |
| 13:21 | lino-i18n 0.3.0 crates published from main `6613b5d` |
| 14:02 | Issue 26 opened by konard (context collected by `/fix --update-all-dependencies`); PR 27 created with `a2556d0` |
| afternoon | Baseline captured, then JS (`4f245e4`), Rust (`b6047f7`), Actions (`7ef241c`), rust-script (`1007a72`), Dependabot (`cb27f42`), pin guard (`942f75f`) and resolver/changeset (`d612a29`) commits |
| later | Upstream reports filed; helper floors raised (`7d0cedd`); CI results recorded in FINAL-VERIFICATION.md |
