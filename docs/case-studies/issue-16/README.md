# Issue 16 CI/CD release failure case study

Issue: <https://github.com/link-foundation/lino-i18n/issues/16>

Pull request: <https://github.com/link-foundation/lino-i18n/pull/17>

Date investigated: 2026-05-18

## Scope

Issue 16 asked for the failed JavaScript and Rust release runs to be checked for
false positives and real errors, compared against the JavaScript, Rust, Python,
and C# pipeline templates, and documented with the downloaded logs and related
data.

This case study covers the two referenced failing runs:

- JavaScript run `26036984249`, created at `2026-05-18T13:36:47Z` for commit
  `8910b98b665a650690c0d9e9188bbf6bec1e9d2c`.
- Rust run `26036984313`, created at `2026-05-18T13:36:47Z` for commit
  `8910b98b665a650690c0d9e9188bbf6bec1e9d2c`.

## Evidence saved locally

The downloaded data is stored under `docs/case-studies/issue-16/data/`:

- `logs/run-26036984249.log`: JavaScript workflow log, 6,896 lines.
- `logs/run-26036984313.log`: Rust workflow log, 4,588 lines.
- `run-26036984249.json` and `run-26036984313.json`: GitHub Actions metadata
  for the referenced runs.
- `recent-runs.json`: recent run list for the issue branch at investigation
  time.
- `npm-view-lino-i18n.json`: npm registry state for `lino-i18n`; npm listed
  only `0.0.1` while the failed workflow attempted `0.1.1`.
- `cargo-search-lino-i18n.txt`: crates.io search state; `lino-i18n` and
  `lino-i18n-macros` were both at `0.0.1`.
- `github-releases.txt`: GitHub Releases at investigation time; `js-v0.0.1`
  and `rust-v0.0.1` existed.
- `templates/*-file-tree.txt`: file trees captured from the current JavaScript,
  Rust, Python, and C# templates.
- `templates/*.diff`: focused workflow/script diffs between this repository
  and the current JavaScript/Rust templates.

## Timeline

- `2026-05-18T13:36:47Z`: JavaScript and Rust workflows started on `main` at
  `8910b98b665a650690c0d9e9188bbf6bec1e9d2c`.
- `2026-05-18T13:39:37Z`: JavaScript release logic decided a release was
  needed for package version `0.1.1`.
- `2026-05-18T13:39:40Z`: JavaScript changesets bumped `js/package.json` from
  `0.1.0` to `0.1.1` and committed the release version.
- `2026-05-18T13:39:42Z`: JavaScript publish attempted to publish
  `lino-i18n@0.1.1`.
- `2026-05-18T13:39:45Z` through `2026-05-18T13:40:10Z`: npm publish retries
  failed with `E404 Not Found - PUT https://registry.npmjs.org/lino-i18n`.
- `2026-05-18T13:39:58Z`: Rust release logic decided a release was needed with
  bump type `minor`.
- `2026-05-18T13:40:01Z`: Rust `version-and-commit.rs` failed to compile under
  `RUSTFLAGS=-Dwarnings` because `get_crate_name` was unused.

## JavaScript root cause

The JavaScript job was not blocked by tests, packaging, npm CLI version, or
provenance generation:

- The workflow upgraded npm from `11.12.1` to `11.14.1`.
- The package metadata has `publishConfig.provenance = true`.
- npm emitted a signed provenance notice during the failed publish attempt.
- The failed request was a registry `PUT` for the existing package name
  `lino-i18n`.

The failure matches a trusted-publisher identity mismatch. npm Trusted
Publisher configuration for GitHub Actions includes a required workflow
filename, and npm notes that publisher configuration is not validated until a
publish attempt. The actions/setup-node trusted publishing guidance also calls
out that a GitHub owner/repository/workflow mismatch can surface as `E404 Not
Found` even when the package exists.

Template comparison supports the same conclusion. The current JavaScript
template uses `.github/workflows/release.yml` and explicitly keeps all npm
publishing in that workflow because npm allows one trusted publisher workflow
file. This repository had renamed the JavaScript pipeline to
`.github/workflows/js.yml`, while npm package setup was still consistent with
the template-style release workflow identity.

Implemented fix:

- Move `.github/workflows/js.yml` to `.github/workflows/release.yml`.
- Update path filters, README badges, release-note badge generation, and tests
  to use `release.yml`.
- Keep the workflow name as JavaScript because this repository still has a
  separate Rust workflow.

## Rust root cause

The Rust failure was a real release-script compile error:

- `rust/scripts/version-and-commit.rs` was run through `rust-script`.
- The workflow sets `RUSTFLAGS=-Dwarnings`.
- The script still contained an older `get_crate_name` helper, but the active
  code path already reads package metadata through `rust_paths::read_package_info`.
- Rust converted the dead-code warning into a hard error before versioning or
  publishing could run.

Implemented fix:

- Remove the unused `get_crate_name` helper instead of suppressing the warning.
- Add a Rust lint-job guard that compiles the Rust helper scripts through
  generated `rust-script` Cargo packages under `RUSTFLAGS=-Dwarnings`, so this
  class of release-script error is caught on pull requests.

The Rust package dry run also emitted a non-fatal metadata warning because
`rust/lino-i18n/Cargo.toml` pointed `readme` at `../../README.md` while the
package already includes `rust/lino-i18n/README.md`. That warning did not fail
the run, but it is actionable release hygiene.

Implemented fix:

- Set `rust/lino-i18n/Cargo.toml` to `readme = "README.md"`.

## False positives and non-blocking findings

- JavaScript lint warnings about complexity and `require-await` appeared in the
  logs, but the lint job concluded successfully and did not block the release.
- JavaScript documentation deploy output included status lines containing
  `error_count`, but the docs job did not cause the failure.
- Rust package readme metadata was a warning, not the failing error; it was
  fixed to keep future dry runs clean.

## Template assessment

No upstream template issue was opened during this investigation.

- JavaScript `scripts/publish-to-npm.mjs` is identical to the template version.
- The JavaScript workflow issue is local: this repository used `js.yml` while
  the current template keeps npm publishing in `release.yml`.
- The Rust dead-code failure is local: the unused helper was left behind after
  this repository adapted the Rust release script to workspace package metadata.
- The Rust readme warning is local package metadata.
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

Commands run successfully:

- `npm ci`
- `npm test`
- `npm run lint` (same four non-blocking warnings as the failed CI log; zero
  errors)
- `npm run format:check`
- `npm run check:duplication`
- `bash scripts/check-file-line-limits.sh`
- `npm pack --dry-run`
- `cargo fmt --manifest-path rust/Cargo.toml --all -- --check`
- `cargo clippy --manifest-path rust/Cargo.toml --all-targets --all-features -- -D warnings`
- `cargo test --manifest-path rust/Cargo.toml --all-targets --all-features`
- `cargo package --manifest-path rust/lino-i18n-macros/Cargo.toml --allow-dirty`
- `cargo package --manifest-path rust/lino-i18n/Cargo.toml --allow-dirty --list`
- `RUSTFLAGS=-Dwarnings cargo check` against generated `rust-script` packages
  for each Rust helper script except the shared `rust-paths.rs` module
- `actionlint .github/workflows/release.yml .github/workflows/rust.yml`

Fresh GitHub Actions runs still need to be checked after the branch is pushed.
