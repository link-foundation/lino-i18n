## Problem

The npm release after PR #38 failed, so npm still serves `lino-arguments@0.3.0` (published 2026-04-10). The dependency updates merged in #38 never reached npm:

- links-notation ^0.23.0
- yargs ^18
- `@dotenvx/dotenvx` ^2

Downstream lockfiles therefore still resolve links-notation 0.11.x and yargs 17 through lino-arguments.

Failing run: https://github.com/link-foundation/lino-arguments/actions/runs/37564452408 (JavaScript CI/CD, `Release` job, 2026-10-07):

```text
node ../scripts/version-and-commit.mjs --mode changeset --tag-prefix "js_" --release-label "JavaScript"
Error: Could not find Cargo.toml in expected locations.
Searched in:
  - ./Cargo.toml (single-language repository)
  - ./rust/Cargo.toml (multi-language repository)
    at getRustRoot (scripts/rust-paths.mjs:82:9)
    at scripts/version-and-commit.mjs:56:18
```

The step runs with the workflow default `working-directory: js` (`.github/workflows/js.yml:47-49`; line 320 calls `../scripts/version-and-commit.mjs`), so the relative lookups `./Cargo.toml` and `./rust/Cargo.toml` can't find the workspace. The JavaScript release path also shouldn't need the Rust root at all.

## Workaround used downstream

https://github.com/link-foundation/lino-i18n/pull/27 keeps `lino-arguments` at ^0.3.0, the latest version on npm, and records the stale transitive versions as blocked by this release.

## Suggested fix

Any one of these:

- Resolve the Rust root from the repository root instead of the current directory, for example `git rev-parse --show-toplevel`, or `path.resolve(fileURLToPath(import.meta.url), '../..')` from `scripts/`.
- Pass `--rust-root ..` or `RUST_ROOT=..` from the JavaScript release step.
- Only call `getRustRoot()` in `version-and-commit.mjs` when the release label is Rust.

Then re-run the release so npm gets 0.4.0.
