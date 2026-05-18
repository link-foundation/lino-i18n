# Issue 16 CI/CD release failure case study

Issue: <https://github.com/link-foundation/lino-i18n/issues/16>

Pull request: <https://github.com/link-foundation/lino-i18n/pull/18>

Date investigated: 2026-05-18

## Scope

Issue 16 asked for failed JavaScript and Rust release runs to be checked for
false positives and real errors, compared against the JavaScript, Rust, Python,
and C# pipeline templates, and documented with downloaded logs and related
data.

This update covers the two originally referenced failed runs plus the newer
Rust failure reported in the issue comment:

- JavaScript run `26036984249`, created at `2026-05-18T13:36:47Z` for commit
  `8910b98b665a650690c0d9e9188bbf6bec1e9d2c`.
- Rust run `26036984313`, created at `2026-05-18T13:36:47Z` for commit
  `8910b98b665a650690c0d9e9188bbf6bec1e9d2c`.
- Rust run `26048388072`, created at `2026-05-18T17:07:44Z` for commit
  `992b91dd1eeb865ff89d2c130c88ad313a609723`.

## Evidence saved locally

The downloaded data is stored under `docs/case-studies/issue-16/data/`:

- `logs/run-26036984249.log`: original JavaScript workflow log.
- `logs/run-26036984313.log`: original Rust workflow log.
- `logs/run-26048388072.log`: follow-up Rust workflow log.
- `run-26036984249.json`, `run-26036984313.json`, and
  `run-26048388072.json`: GitHub Actions metadata for the referenced runs.
- `issue-comment-4480171745.png`: issue screenshot showing npm Trusted
  Publisher configured for `js.yml`.
- `pr-18-*.json`: PR 18 conversation, review, and inline review data.
- `recent-runs*.json`: recent run lists captured during investigation.
- `npm-view-lino-i18n.json`, `cargo-search-lino-i18n.txt`, and
  `github-releases.txt`: external package and release state.
- `templates/*`: captured template file trees and focused diffs.

## Timeline

- `2026-05-18T13:36:47Z`: JavaScript and Rust workflows started on `main` at
  `8910b98b665a650690c0d9e9188bbf6bec1e9d2c`.
- `2026-05-18T13:39:42Z`: JavaScript publish attempted to publish
  `lino-i18n@0.1.1`.
- `2026-05-18T13:39:45Z` through `2026-05-18T13:40:10Z`: npm publish retries
  failed with `E404 Not Found - PUT https://registry.npmjs.org/lino-i18n`.
- `2026-05-18T13:40:01Z`: Rust `version-and-commit.rs` failed to compile under
  `RUSTFLAGS=-Dwarnings` because an unused helper became a hard error.
- `2026-05-18T17:07:44Z`: Rust workflow started again on merge commit
  `992b91dd1eeb865ff89d2c130c88ad313a609723`.
- `2026-05-18T17:11:52Z`: Rust release build failed because
  `lino-i18n` required local path dependency `lino-i18n-macros = "^0.0.1"`
  while the workspace had been bumped to `0.1.0`.
- `2026-05-18T17:27:56Z`: the issue author noted npm Trusted Publisher had
  been updated for `js.yml`, so the JavaScript workflow could be renamed back.

## JavaScript root cause

The original JavaScript job was not blocked by tests, packaging, npm CLI
version, or provenance generation. npm emitted a signed provenance notice, then
the registry rejected the package `PUT` with `E404`.

That pattern matched a Trusted Publisher workflow identity mismatch. npm
Trusted Publisher configuration for GitHub Actions includes a workflow
filename, and owner/repository/workflow mismatches can surface as `E404 Not
Found` during publish.

Follow-up issue data shows the npm Trusted Publisher connection now points to
`js.yml`, so this PR restores the JavaScript workflow filename and all local
references to `js.yml`:

- `.github/workflows/release.yml` moved back to `.github/workflows/js.yml`.
- Workflow path filters now watch `.github/workflows/js.yml`.
- README badges, JavaScript release-note badges, line-limit checks, and tests
  now reference `js.yml`.

## Rust root causes

The original Rust failure was a release-script compile error. The workflow sets
`RUSTFLAGS=-Dwarnings`, and an unused helper in `version-and-commit.rs` was
promoted from a warning into a hard error. That was addressed before this
follow-up.

The newer Rust failure was a manifest consistency bug:

- The Rust workspace version was bumped to `0.1.0`.
- `rust/lino-i18n/Cargo.toml` still required
  `lino-i18n-macros = { version = "0.0.1", path = "../lino-i18n-macros" }`.
- `cargo build --manifest-path rust/Cargo.toml --release` failed because the
  local path dependency version no longer satisfied `^0.0.1`.

Implemented fix:

- Update the current `lino-i18n-macros` dependency pin to `0.1.0`.
- Update `rust/scripts/version-and-commit.rs` so future release bumps also
  rewrite local path dependency versions and `Cargo.lock` workspace package
  versions for publishable workspace crates.
- Add a regression test that checks Rust local path dependencies match the
  workspace package version and that `Cargo.lock` is not left stale.

## Template assessment

No upstream template issue was opened during this investigation.

- The JavaScript template still uses `release.yml`; the local npm Trusted
  Publisher configuration now intentionally uses `js.yml`.
- The Rust dead-code failure was local to this repository's adapted release
  script.
- The Rust path dependency version mismatch was local package metadata and
  release-versioning behavior.
- Python and C# template file trees were captured for context; no matching
  defect was found there.

## External references

- npm Trusted Publishers documentation:
  <https://docs.npmjs.com/trusted-publishers/>
- npm provenance documentation:
  <https://docs.npmjs.com/generating-provenance-statements/>
- actions/setup-node trusted publisher guidance:
  <https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md#publishing-to-npm-with-trusted-publisher-oidc>

## Verification performed

Local verification logs are stored in
`docs/case-studies/issue-16/data/verification/`.

Commands run successfully during the follow-up:

- `node --test js/tests/release-delivery.test.js`
- `cargo build --manifest-path rust/Cargo.toml --release`
- `npm test`
- `npm run lint`
- `npm run format:check`
- `npm run check:duplication`
- `bash scripts/check-file-line-limits.sh`
- `npm pack --dry-run`
- `cargo fmt --manifest-path rust/Cargo.toml --all -- --check`
- `cargo clippy --manifest-path rust/Cargo.toml --all-targets --all-features -- -D warnings`
- `cargo test --manifest-path rust/Cargo.toml --all-targets --all-features`
- `cargo package --manifest-path rust/lino-i18n-macros/Cargo.toml --allow-dirty`
- `cargo package --manifest-path rust/lino-i18n/Cargo.toml --allow-dirty --list`
- Rust helper script compilation through generated `rust-script` packages.
- `actionlint .github/workflows/js.yml .github/workflows/rust.yml`
