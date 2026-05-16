# Issue 5 Case Study: Restoring Full CI/CD and Publishing

## Scope

Issue: https://github.com/link-foundation/lino-i18n/issues/5

Prepared PR: https://github.com/link-foundation/lino-i18n/pull/6

The issue reported that PR 2 accidentally removed the full release automation from the original templates while moving the project into language-specific `js/` and `rust/` subdirectories. The requested outcome was not just to restore tests, but to restore the full CI/CD lifecycle: package publishing, GitHub releases with badges, generated GitHub Pages documentation, and preserved investigation data.

## Saved Evidence

Raw data and logs are saved under [`data/`](data/):

- `issue-5.json`, `issue-5-comments.json`
- `pr-6.json`, `pr-6-*-comments.json`, `pr-6-reviews.json`
- `pr-2.json`, `pr-2.diff`, `pr-2-files.json`
- `ci-runs-*.json`
- `repo-file-tree-before-fix.txt`
- `js-template-file-tree.txt`, `rust-template-file-tree.txt`
- `js-template-release.yml`, `rust-template-release.yml`
- `js-template-scripts.txt`, `rust-template-scripts.txt`
- `npm-view-lino-i18n.*`, `cargo-search-lino-i18n.*`
- `online-references.md`

## Timeline

- 2026-05-16 17:45 UTC: PR 2 was merged. It added the initial JS and Rust packages, but the PR file list shows the root `scripts/` directory, root release workflow, root lint/format/secret configs, example app workflow, and link checker workflow were removed.
- 2026-05-16 18:21 UTC: main branch JS and Rust checks were green after PR 4. Those checks validated build/test behavior but did not restore publishing, release creation, or Pages deployment.
- 2026-05-16 18:54 UTC: issue 5 was opened to restore the template-level CI/CD functionality and save a deep case study.
- Before this fix, branch `issue-5-35d32a59c464` had no CI runs recorded.

## Requirements

- Restore JavaScript template CI/CD scripts under `js/scripts`.
- Restore Rust template CI/CD scripts under `rust/scripts`.
- Make `js.yml` and `rust.yml` own full test, release, publishing, and Pages deployment for their language.
- Publish real packages to npm and crates.io.
- Create GitHub releases with useful package and CI badges.
- Generate and deploy GitHub Pages documentation automatically.
- Compare the current repo against the JS and Rust CI/CD templates.
- Save issue, PR, CI, template, registry, and online research data in `docs/case-studies/issue-5`.
- Report upstream template issues if the same defect exists there.

## Root Causes

1. PR 2 moved package code into `js/` and `rust/`, but deleted the root CI/CD support files instead of relocating them.
2. The replacement `js.yml` and `rust.yml` were test-only workflows. They did not run release checks, publish packages, create GitHub releases, or deploy documentation.
3. The original scripts assumed a single-language repository root. They needed path adaptation so JS scripts use `js/package.json` and Rust scripts use `rust/Cargo.toml`.
4. The Rust package is a workspace with two publishable crates. Release automation had to publish `lino-i18n-macros` before `lino-i18n`, then wait for the macro crate to appear in the crates.io index.
5. Registry checks showed the current packages were not published yet: `npm view lino-i18n` returned 404, and `cargo search lino-i18n` returned no result. That means release checks must be able to publish the current `0.0.1` artifacts without forcing an artificial bump first.

## Template Assessment

The issue is not an upstream template defect. The JS and Rust templates still contain the release workflow and script sets. The break happened during repository integration in PR 2, where files were removed from this repo instead of being relocated into `js/scripts` and `rust/scripts`.

No upstream issue was opened because there is no reproducible defect in either template repository from the collected evidence.

## Implemented Solution

### JavaScript

- Restored JS release scripts under `js/scripts`.
- Restored JS lint/format/secret/duplication configs under `js/`.
- Moved Changesets config into `js/.changeset`.
- Added package metadata needed for publication: package files, homepage, bugs, and public provenance-ready publish config.
- Added `js/CHANGELOG.md` and kept no pending changeset so the release check can self-heal the missing `0.0.1` npm package.
- Added `js/scripts/build-docs-site.mjs` to generate a static Pages artifact from the package README, root README, and changelog.
- Replaced `js.yml` with full CI/CD: change detection, lint/format/duplication/secret checks, Node/Bun/Deno matrix, CLI smoke test, npm pack dry run, npm publish, GitHub release, manual release, manual changeset PR, and Pages deploy.
- Added a package metadata test that verifies `npm pack --dry-run --json` includes runtime files and excludes tests/scripts.

### Rust

- Restored Rust release scripts under `rust/scripts`.
- Added `rust/changelog.d/README.md` and `rust/CHANGELOG.md`.
- Added `rust/scripts/build-docs-site.rs` to generate a static Pages artifact and include rustdoc output.
- Adapted Rust path helpers for this workspace layout and `version.workspace = true`.
- Updated version/release scripts to edit the workspace version manifest when needed.
- Updated publishing to publish all publishable workspace crates, sort macro crates first, skip already-published crates, and wait for macro crate indexing before publishing the runtime crate.
- Updated release checks to verify all publishable crates, not only the first workspace member.
- Re-exported `Catalogue` from the Rust crate root so public parser APIs have nameable public return types and rustdoc passes with `-Dwarnings`.
- Replaced `rust.yml` with full CI/CD: change detection, changelog/version checks, fmt/clippy/tests/example, package checks, crates.io publish, GitHub release, manual release, manual changelog PR, and Pages deploy.

## External References Used

- npm trusted publishing and provenance: https://docs.npmjs.com/trusted-publishers
- npm provenance statements: https://docs.npmjs.com/generating-provenance-statements
- Cargo publishing: https://doc.rust-lang.org/cargo/reference/publishing.html
- Cargo publish command: https://doc.rust-lang.org/cargo/commands/cargo-publish.html
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub Releases API: https://docs.github.com/rest/reference/releases

## Verification

Local verification run before PR update:

- `cd js && npm run lint`
- `cd js && npm run format:check`
- `cd js && npm run check:duplication`
- `cd js && npm test`
- `cd js && bash scripts/check-mjs-syntax.sh`
- `cd js && bash scripts/check-file-line-limits.sh`
- `cd js && node scripts/build-docs-site.mjs`
- `cd js && npm pack --dry-run --json`
- `cargo fmt --manifest-path rust/Cargo.toml --all -- --check`
- `rustfmt --check rust/scripts/*.rs`
- `cargo clippy --manifest-path rust/Cargo.toml --all-targets --all-features -- -D warnings`
- `cargo test --manifest-path rust/Cargo.toml --all-targets`
- `cargo run --manifest-path rust/lino-i18n/Cargo.toml --example basic`
- `cargo package --manifest-path rust/lino-i18n-macros/Cargo.toml --allow-dirty`
- `cargo package --manifest-path rust/lino-i18n/Cargo.toml --allow-dirty --list`
- `RUSTFLAGS=-Dwarnings cargo doc --manifest-path rust/Cargo.toml --workspace --no-deps`
- `rust-script rust/scripts/build-docs-site.rs`
- workflow YAML parsing for `.github/workflows/js.yml` and `.github/workflows/rust.yml`
- compile-only cargo checks for executable `rust/scripts/*.rs`

## Notes

The runtime Rust crate cannot run a full `cargo package` verification before the first macro crate publish because Cargo resolves registry dependencies before packaging, and `lino-i18n-macros@0.0.1` does not exist yet. CI therefore performs a real dry run for the macro crate and a runtime archive file-list check before the first release. The actual release path publishes the macro crate first, waits for it to be visible on crates.io, and then publishes the runtime crate.
