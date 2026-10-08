# Verification record

Verification was performed on 2026-10-08 in the prepared issue branch. Logs are
kept locally in the ignored `ci-logs/` directory. The tests and experiment scripts
are versioned, so results can be reproduced without depending on local logs.
See PR 28's checks for the final pushed revision and platform matrix.

## Before implementation

| Reproduction | Observed failure | Regression coverage |
| --- | --- | --- |
| Import the source runtime and render rich source content | `ERR_MODULE_NOT_FOUND` for `js/src/messages.js`; source APIs did not exist. | `messages.test.js`, `react-content.test.js` |
| Extract source and request-isolated server messages | Source/tooling/server exports were absent. | `tooling.test.js`, `server.test.js` |
| Format and reload quoted sentence keys | JS lost source keys; Rust failed with `locale root break cannot have a direct value` for a newline key. | `source-keys.test.js`, Rust `tests/messages.rs` |
| Convert compiled ICU select, quoted literal and skeletons | Converter produced `{literal} {gender} {price}`; formatting threw `MISSING_VALUE` for `literal`. | `icu-conversion.test.js` |
| Round-trip `__proto__` as a catalog key | JavaScript result omitted the own property. | `source-keys.test.js` |
| Pass an explicit id in a source call | Returned `Welcome` instead of catalog value `Bienvenue`. | `messages.test.js` |
| Compare old/new stable-id source manifests | CLI returned success despite changed source requiring review. | `tooling-integration.test.js` |
| Extract the `m` tagged alias and boolean/comment-only JSX | Extraction omitted `m` and produced `falseHello <c0></c0>` instead of runtime identities. | `tooling.test.js` |
| Derive one JSX variant with an explicit id | Extractor accepted an id inconsistent with source-variant identities. | `derivation.test.js` |
| Derive a boolean JSX child | Extracted `Hello false` where React renders `Hello `. | `derivation.test.js` |
| Follow inherited case-study links after moving their files | Three links target missing files. | `experiments/issue-25-ci-regressions.py` |
| Run PR checks with the release preflight intentionally skipped | Changeset, changelog, browser and CLI jobs skip despite detected code changes. | Workflow policy and `experiments/issue-25-ci-regressions.py` |

## Local checks

Run JavaScript commands from `js/` and other commands from the repository root.

| Command | Result |
| --- | --- |
| `npm test` | 97 tests pass with a 30-second per-test timeout. |
| `bun test --timeout 30000` | 97 tests pass. |
| `deno test --no-check --allow-read --allow-write --allow-env --allow-run` | 97 tests pass. Node subprocesses run CLI/Rollup build integration fixtures. |
| `npm run test:types` | Public source, React, browser, server and tooling declarations compile. |
| `npm run test:browser` | Three Chromium tests pass, including React source content switching and native browser export/tree shaking. |
| `npm run check` | ESLint, Prettier and duplication checks pass. |
| `npm run lint:secrets` | Pass. |
| `npm audit --package-lock-only --audit-level=high` | Zero vulnerabilities reported. |
| `bash scripts/check-mjs-syntax.sh` | Pass. |
| `node examples/source-messages.mjs` | Source/deferred/context/derived example runs. |
| `node bin/lino-i18n.js extract --in examples/source-messages.mjs --out ../ci-logs/example-catalogs` | Example sources extract without executing application code. |
| `cargo test --locked --manifest-path rust/Cargo.toml --workspace --all-features` | Pass, including optional ICU and doctests. |
| `cargo +1.87.0 test --locked --manifest-path rust/Cargo.toml --workspace --all-targets` | Default-feature MSRV tests pass. |
| `cargo fmt --manifest-path rust/Cargo.toml --all -- --check` | Pass. |
| `cargo clippy --locked --manifest-path rust/Cargo.toml --workspace --all-targets --all-features -- -D warnings` | Pass. |
| `node --test --test-timeout=30000 scripts/*.test.mjs` | 48 repository tooling tests pass. |
| `python3 scripts/check-docs.py` | Pass. Raw upstream HTML README is preserved as `.txt`. |
| `python3 scripts/check-file-line-limits.py` | Pass. |
| `python3 scripts/check-ci-policy.py` | Pass with pinned PyYAML installed. |
| `python3 scripts/check-dependency-pins.py` | Pass with pinned PyYAML installed. |
| `python3 experiments/issue-26-dependency-pins.py` | Pass; deliberate action/tool/MSRV/Node drift fixtures are rejected. |
| `python3 experiments/issue-23-shared-guards.py` | Pass. |
| `python3 experiments/issue-25-ci-regressions.py` | Three tests pass; before the fix, five subcases fail for moved links and implicit workflow status conditions. |
| `node js/scripts/build-docs-site.mjs` and `cargo doc --locked --manifest-path rust/Cargo.toml --workspace --no-deps` | Documentation builds pass. |
| `python3 experiments/collect-issue-25.py` | Pinned evidence recollection succeeds. |

The npm package dry-run is part of the automated test suite and checks that new
runtime exports and declarations ship while tests/build scripts stay excluded.
Screenshots were captured with Chromium through Playwright MCP, then the browser
and example server were closed. The optional ICU cache holds at most 100 compiled
messages; static derivation is bounded to 100 variants and 20 levels.

## CI investigation

The first pushed revision was `8fbe27cd6681acf31d8ebf60e6d9ff5e14608455`.
Runs created at `2026-10-08T18:37:16Z` were verified against that SHA; logs were
downloaded before making corrections.

- [Documentation run 37825695185](https://github.com/link-foundation/lino-i18n/actions/runs/37825695185):
  log lines 974–976 and 996–998 report three missing local case-study files
  referenced from `docs/BEST-PRACTICES.md`. Their links now include the preserved
  `template-background/` location.
- [JavaScript run 37825695215](https://github.com/link-foundation/lino-i18n/actions/runs/37825695215):
  log lines 526–531 confirm all code flags, including `any-code-changed=true`.
  The skipped checks were caused by GitHub's implicit `success()` job condition
  following an intentionally skipped release-preflight ancestor. The affected
  checks now use `!cancelled()` and require their immediate dependency to pass.
  Workflow policy rejects this accidental implicit gating, and the regression
  experiment runs in the workflow-policy job.

## Limits of the evidence

Framework deployment, real translation providers and full GT services were not
exercised. Generic request helpers and mocked provider contracts do not prove
dedicated Next/TanStack/Native/Vue/Sanity compatibility or hosted-service parity.
Those requirements remain in the capability matrix. Minor release fragments
prepare the existing release automation; no release was published directly.
