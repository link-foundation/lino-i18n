# Dependency refresh investigation: issue 43 / PR 44

Repository: https://github.com/link-foundation/lino-i18n. Review: https://github.com/link-foundation/lino-i18n/pull/44. Research date: November 13, 2026 UTC. Baseline: `3da5027bc418f86c9ad47bf15b410d434e3376a0`.

The repository changes repair the merged Dependabot regressions and refresh the supported dependency graph. **The complete issue is not yet achieved:** latest official npm 12.2.2 bundles two dependencies affected by public advisories, and an unmerged PR cannot make the default branch green. These limits must remain visible even when PR CI passes. No required sub-issues were listed; initial PR conversation, inline comments and reviews were empty.

## Scope and evidence

`PLAN.md` inventories every requirement and the proposed solution/verification for each. `github/` preserves issue details, the later main-CI comment, all three PR comment types, related merged PRs, run timestamps and SHAs. `registry/` contains live npm, crates.io, PyPI, language, action-release and Docker registry responses. The collector bounds concurrent network requests to four and avoids installing packages for inventory.

The complete tables are [npm direct/peer](registry/npm-direct.md), [npm lock tree](registry/npm-lock.md), [every npm exception](registry/npm-exceptions.md), [npm CLI's separate bundled tree](registry/npm-tool-bundle.md), [Cargo and rust-script dependencies](registry/cargo.md), [Actions/images](registry/actions.md), and [languages/tools/Python/Ruby](registry/tools-python-ruby.md). They include before, after, current registry release, and a reason for every retained older version. Per-location npm constraints are in `npm-parents.json`; this is more precise than treating a package name installed at multiple versions as one dependency.

Only live manifests are updated. The Ruby detector found two archived copies of Dependabot source, not executable repository Ruby. There is no Gemfile, gemspec, Ruby lock, or live Dockerfile. Adding an empty Bundler ecosystem would invent dependencies. HTML and shell use the inventoried JS, Cargo, Actions and toolchain dependencies. The Docker composite accepts its caller's Dockerfile; its own action pins are inventoried.

## Actual failures and reproduction

| Trigger | Actual cause and evidence | Solution and verification |
| --- | --- | --- |
| Dependabot Cargo PR 31 | Run 42064277761, log line 1952: no new Rust changelog fragment | Add a minor fragment covering dependencies, supported compiler floor and auth regression; retain strict release gating. |
| Dependabot Actions PR 38 / main Workflows | Run 42064419805 has three failed copied-SHA assertions (lines 674, 686, 698); main run 43509241784 repeats the regression | The fixture duplicated an old auth action commit instead of validating action identity. Match the intended action plus an immutable 40-hex commit; retain the separate cross-workflow uniform-pin guard. `issue-43-crates-auth-baseline.py` executes the unmodified baseline fixture against the refreshed workflows: three failures before; all eight auth tests pass after. |
| Dependabot npm PR 42 | Run 43259599092, line 1242: no changeset in the PR | Add a JS minor changeset for dependencies, Node floor and npm 12 metadata migration. Do not bypass changeset checks for dependency changes. |
| Main Rust run reported in later issue comment | Run 43509230243 used older `c219a7f`, not final main `3da5027`; lines 7899–7902 reject a concurrently changed JS lockfile | This is an intentional release race guard, not a compiler or crate failure. Preserve the guard, validate a fresh merged main state, and retain existing release-race regressions. Do not release untested intervening source edits. |
| First refreshed PR run | Workflows 43516907532 lines 169–180 report `adhoc-packages`; exit 12 at line 181 | Precisely annotate the exact-version global npm CLI installation. Application installs remain `npm ci`; ordinary application packages are not exempt. Both zizmor modes pass locally. |
| npm 12 migration | Existing package-surface test treats `npm pack --json` as an array; npm 12 returns an object keyed by package name | Read the documented keyed result. This is an assertion over actual `npm pack`, not a mocked output fixture. All 197 JS tests pass under npm 12. |

Downloaded CI logs are preserved in `ci-logs/` with a checksum index; use `gzip -dc` for compressed files and read at most 1500 lines at once. A failed older run is never used as evidence that the current commit fails. Local experiment scripts remain in `experiments/` for reuse.

## Solutions considered and applied

### JavaScript and TypeScript

Use registry `latest` metadata and npm-check-updates across major boundaries, then `npm update` to refresh compatible transitive resolutions. Both manifest and lock are committed. The actual changes from this baseline are mainly patch/minor updates: Babel 8, ESLint 10, TypeScript 7, Changesets 3, Vite 8, Next 16 and React 19 had already landed before this issue; this PR does not pretend to migrate those majors again. Current Babel/FormatJS/parser/codec APIs pass existing extraction, browser, framework and runtime coverage.

The substantive new major migration is npm 11 → 12. Its upstream changelog documents keyed pack/publish JSON, exact supported Node patch floors, removed commands, stricter CLI flags, and lifecycle-script approval. Repository searches found no remaining shrinkwrap/star/adduser consumers or npm-view JSON parser needing adaptation. Keep the existing explicit esbuild `allowScripts` policy. Test and release with the same exact npm 12.2.2; the shared pin guard detects drift. Raise the Node floor to 22.22.2 and validate npm's precise `^22.22.2 || ^24.15.0 || >=26.0.0` support range in the actual bootstrap.

Replace the custom semantic-version parser/comparator/release-selector with maintained `semver@7.8.6`, deleting roughly 90 lines of duplicated general logic. Keep the existing integrity-verified tarball recovery for the known missing-module runner image and its tests. New tests exercise upgrade from bundled npm 11 and rejection of unsupported Node patch/odd versions before invoking npm.

Raise optional peer floors to the current tested versions. Preserve the existing React 18 consumer contract and explicit ESLint 9 plugin compatibility fixture; the primary linter is current ESLint 10. Removing that fixture to eliminate its pre-existing EOL notice would remove advertised compatibility coverage. No newly introduced deprecation is accepted as a successful migration.

Every older transitive version has its actual parent constraint documented. For example, Babel 7 internals belong to current TanStack parents, and Rolldown's exact platform binaries must match its core ABI. Blindly overriding all such dependencies could produce a newer-looking but invalid tree. The parent packages themselves are current. The regenerated app tree has zero npm advisories, including the moderate Seroval findings discovered and removed by the transitive refresh.

### Rust and release helpers

Update both workspace members to published codec 0.9.3, syn 3.0.10 and optional FormatJS 0.3.3. Refresh Cargo.lock and all standalone rust-script manifest blocks (ureq, serde_json, toml), not just workspace crates. The registry-guided manifest rewrite performs the same incompatible-range review as cargo-edit without compiling a one-off updater in the constrained container.

The current optional FormatJS dependency requires Rust 1.92. Adopt one honest workspace floor of 1.92, test optional ICU on the MSRV as well as stable, and refresh ICU to 2.4. Edition 2024 is already current. The newly applicable Clippy diagnostics are addressed with supported let chains in seven places; lookup order, source fallback, cache eviction and loader behavior remain the same. Runtime, macro, all-feature, example, doctest and documentation coverage are retained.

Two older crates remain deliberately: published codec 0.9.3 requires parser ^0.27.1, despite migrated upstream source, and current num-rational/calendrical_calculations still require num-bigint ^0.4 rather than incompatible 0.5. These constraints are explicit in `cargo.md`. JavaScript codec 0.9.6 and Rust codec 0.9.3 are different latest registry releases, not accidental inconsistent pins; both Rust member pins match.

### Python, Actions, languages and images

PyYAML 6.0.3 is already the current sole pip requirement and has no transitives. Keep its exact requirement; move CI Python to 3.15.2 and add required pip-audit 2.10.1. Python's 3.15 porting notes were reviewed; scripts use supported standard APIs and the existing extraction integration is tested across all runtime/OS jobs. Do not add a packaging system where none exists.

Node 26 is the primary LTS; keep supported Node 22/24 test legs. `setup-node` uses `check-latest` so a runner's cached older patch cannot silently satisfy the rolling release pin. Rust stable, Bun 1.4.4 and Deno 2.9.8 are current from upstream metadata. Update security tools and every stale action SHA; keep already-current trusted-publisher major tags under the repository's existing policy. Docker Hub's latest actionlint image and 1.7.12 resolve to the same pinned digest; do not pull a large image just to verify a manifest digest.

Dependabot already covers `/js`, the Cargo workspace including both member manifests, `/scripts`, root workflows and `.github/actions/*`. Its comments honestly identify rust-script blocks and tool-version arguments that Dependabot does not update. No new live package manifest or unsupported Ruby entry is necessary.

## Existing components and alternatives researched

| Component | Use / decision |
| --- | --- |
| npm-check-updates 23.1.1 | Registry-backed direct dependency range refresh across majors; existing npm update then refreshes transitives. |
| cargo-edit 0.13.14 | Stable incompatible-requirement updater; equivalent metadata-guided edits avoid compiling the updater locally. |
| npm/node-semver 7.8.6 | Adopted in release bootstrap in place of a handwritten comparator. |
| Dependabot | Existing ecosystem grouping and composite discovery retained; no need for a second updater service. |
| Renovate | A valid alternative for grouped tool/regex updates, but introducing another service is unnecessary for this repair. |
| cargo-audit 0.23.0 / pip-audit 2.10.1 / npm audit | Existing/new required audits cover actual application locks/requirements; separate CLI bundle probe makes the tool gap visible. |
| actionlint 1.7.12 / zizmor 1.32.0 | Current workflow validators retained. Existing precise actionlint schema exceptions remain necessary while upstream reports are open. |
| gt-rrweb 0.2.0 | Existing upstream collector/overlay primitives already replace general harvesting logic. The remaining marked-variable fallback workaround is still needed and has a finite upstream reproduction. |

## Upstream reports and remaining workarounds

- [npm/cli#10299](https://github.com/npm/cli/issues/10299): latest official npm bundles glob 13.0.6 and minimatch 10.2.5 matching two public advisories. The finite metadata-only probe audits previous npm 11.21.0, current 12.2.2, and current with overrides. Overrides leave identical lock hashes and 21 moderate package findings (two underlying advisories). Keep the official latest CLI rather than silently replacing incompatible internal APIs; **tool security acceptance remains blocked** until a supported fixed bundle is published. Downgrading to npm 9 as suggested by audit contradicts the requested current-release migration and removes npm 12 behavior.
- [codec#84](https://github.com/link-foundation/lino-objects-codec/issues/84): publish the Rust parser migration with a new crate version; immutable existing 0.9.3 cannot be republished with a different graph. Retain latest published codec until then.
- [lino-env#33 follow-up](https://github.com/link-foundation/lino-env/issues/33#issuecomment-6866277754) and [lino-arguments#46 follow-up](https://github.com/link-foundation/lino-arguments/issues/46#issuecomment-6866278320): source migration is not fully published/current, so the latest parent still pulls parser 0.11.2. Retain the supported environment API until a coordinated release exists; do not force a cross-major environment override.
- [gt#2791](https://github.com/generaltranslation/gt/issues/2791): marked variable text enters the bare-string fallback and can be translated as an unrelated message. Reproduced against published 0.2.0, checked current source, proposed marking all owned text nodes covered. Existing downstream wrapper and regression remain intact.
- Existing [actionlint#657](https://github.com/rhysd/actionlint/issues/657) and [#682](https://github.com/rhysd/actionlint/issues/682) already document the queue schema and Ubuntu runner-label gaps. Existing [lychee#2297](https://github.com/lycheeverse/lychee/issues/2297) already contains a reproduction, concrete retry-classifier patch and maintainer confirmation for the external retry helper. Keep narrowly scoped workarounds; do not spam duplicate reports or remove protection before upstream support exists.

## Verification and limits

Local commands and full exit statuses are in `verification/*-results.json`: JS tests (197 pass), all type configurations, lint, formatting, duplication, secrets and package dry-run; Rust formatting, Clippy with warnings denied, all-target/all-feature build, workspace tests/doctests and docs; workflow policy, pin drift regressions, auth regressions, archive/shared guards, docs and hooks. Both zizmor modes pass. npm application audit, Cargo audit with warnings denied and pip-audit report zero advisories. The separate npm CLI audit does not.

Rust uses one build job and debug information disabled; observed maximum child RSS is 608180 KiB. JS heap is capped at 1024 MiB, bundle probes at 512 MiB. Framework/browser builds and OS/runtime/MSRV matrices are verified by existing CI rather than duplicated locally. No product UI was changed, so visual before/after screenshots are inapplicable.

All five workflows passed at follow-up commit `79343c0ea862322aebed5e134ee01e2c6cd45622`; matching head SHAs, timestamps and URLs are preserved in `github/implementation-ci-success.json`. The earlier Workflows failure was the precise install annotation and is corrected. The final evidence/documentation commit must also pass; its immutable run URLs/results are recorded in the PR after the final push. Release jobs intentionally skip on PRs; release race/auth preflight checks are tested without publishing packages. JS and Rust minor fragments prepare the automatic release triggers.

Final acceptance still requires: (1) a supported official npm CLI bundle without the two advisories, followed by rerunning the tool audit; (2) review/merge of this unmerged PR and successful default-branch CI. Current green PR checks alone do not establish either. The goal is not marked complete and no merge/default-branch push is performed.
