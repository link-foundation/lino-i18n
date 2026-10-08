# GitHub Actions, runners and CI toolchain pins: research (2026-10-08)

Scope: `.github/workflows/{docs,js,rust,security,workflows}.yml`,
`.github/actions/publish-dockerhub/action.yml`, `js/scripts/setup-npm.mjs`,
`scripts/check-ci-policy.py`, `.github/zizmor.yml`.

All data below was gathered on 2026-10-08 with `gh api`, `gh release view`,
`npm view`, the crates.io API, the Docker Hub API and `nodejs.org/dist/index.json`.

## 1. Summary table

Line numbers refer to the `uses:` line, or to the `with:` value for tool versions.

| Action / tool | Occurrences (file:line) | Current pin | Latest tag | Latest SHA / digest | Breaking changes (current -> latest) | Recommended new pin |
|---|---|---|---|---|---|---|
| actions/checkout | workflows.yml:33,50,65,83; rust.yml:75,102,124,160,206,239,276,361,424,477,518,537; docs.yml:37,61,106; security.yml:25,41,56,89,107; js.yml:75,108,142,164,187,231,282,342,378,422,460,526,580,631,672,693 (40 total) | `@v6` | v7.0.1 (2026-07-20) | `3d3c42e5aac5ba805825da76410c181273ba90b1` (`v7` = `v7.0.1`) | v7: refuses to check out fork PR code on `pull_request_target` / `workflow_run` unless `allow-unsafe-pr-checkout: true`; ESM migration. Runtime stays `node24`. `persist-credentials` default unchanged (still `true`). Not relevant here: the repo has no `pull_request_target` or `workflow_run` triggers. | `actions/checkout@v7` (no input changes) |
| actions/setup-node | rust.yml:280,365,481,521; docs.yml:41,64; security.yml:28; js.yml:79,117,191,240,291,296,351,387,431,464,530,584,635,675 (21 total) | `@v6` | v7.1.0 (2026-10-08) | `949feb2413d6458794dcd2491c4babbbce0c15c1` (`v7` = `v7.1.0`) | v7.0.0 removes the dummy `NODE_AUTH_TOKEN` fallback. With `registry-url` and no `NODE_AUTH_TOKEN`, Yarn 1 and older npm may fail. The README says: "npm Trusted Publishing (OIDC) is not affected". ESM migration. Runtime stays `node24`. Caching defaults are unchanged from v6: `package-manager-cache: true` auto-caches only when `packageManager`/`devEngines.packageManager` is npm. v7.1.0 adds mise.toml support, absolute `node-version-file` paths, and version validation plus manifest fetch retry. | `actions/setup-node@v7`. Keep `registry-url` in js.yml:467,533. Don't add `NODE_AUTH_TOKEN`; OIDC handles auth. |
| actions/upload-artifact | docs.yml:78 (`@v6`); js.yml:360 (`@v7`) | `@v6` and `@v7` | v7.0.2 (2026-10-07) | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | v7.0.0: ESM, plus a new `archive` input (default `true`, so zipped as before). No input removals. Runtime `node24`. | Unify on `actions/upload-artifact@v7` (docs.yml:78) |
| actions/configure-pages | rust.yml:489; js.yml:643 | `@v6` | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` | none (already on latest major) | keep `@v6` |
| actions/upload-pages-artifact | rust.yml:495; js.yml:649 | `@v5` | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` | none | keep `@v5` |
| actions/deploy-pages | rust.yml:499; js.yml:653 | `@v5` | v5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` | none | keep `@v5` |
| actions/dependency-review-action | security.yml:92 | `@v5` | v5.0.0 | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` | none (no v6) | keep `@v5` |
| github/codeql-action (init/analyze) | security.yml:62,67 | `@v4` | v4.38.3 (2026-10-08); bundle codeql-bundle-v2.27.2 | `24c54180a607b1449ed407dd24f251e4e9147c8d` | none. v4 is the current major (no `v5` tag). v3 still gets parallel releases (v3.38.2). | keep `@v4` |
| docker/setup-buildx-action | publish-dockerhub/action.yml:34 | `@v4` | v4.4.1 | `f87e5991a6d7451dcb8d9637bfbc97413f497069` | none (no v5) | keep `@v4` |
| docker/login-action | publish-dockerhub/action.yml:37 | `@v4` | v4.6.0 | `dbcb813823bdd20940b903addbd779551569679f` | none (no v5) | keep `@v4` |
| docker/metadata-action | publish-dockerhub/action.yml:44 | `@v6` | v6.2.0 | `dc802804100637a589fabce1cb79ff13a1411302` | none (no v7) | keep `@v6` |
| docker/build-push-action | publish-dockerhub/action.yml:54 | `@v7` | v7.4.0 | `c3c9e263c25d99ce0380d002d59b67737d91b0dc` | none (no v8) | keep `@v7` |
| lycheeverse/lychee-action | docs.yml:68 | `@v2` | v2.9.0 (2026-07-09) | `e7477775783ea5526144ba13e8db5eec57747ce8` (`v2` = `v2.9.0`) | none. v2 is the latest major (no v3). The default `lycheeVersion` is now `v0.24.2`, which matches the latest lychee release (lychee-v0.24.2, 2026-05-01). lychee 0.24 adds line/column numbers to reports, so the markdown output format may differ slightly. Keep `scripts/check-web-archive.mjs` parser tests green. | keep `@v2` (optionally pin `lycheeVersion: v0.24.2` explicitly) |
| dtolnay/rust-toolchain | rust.yml:79,106,128,169,215,248,283,368,428,484; docs.yml:44; js.yml:638 (12 total) | `89b12181fb390509a0842a86cc55eeb8eb928c1d` | branch `stable` | `stable` head = `89b12181fb390509a0842a86cc55eeb8eb928c1d` (2026-10-01, "toolchain: stable"); `master` and `v1` head = `7e38f4b43b4db5c8dd498af069a4f6196df1d067` (the pinned commit's parent) | none. The pin is already the current `stable` branch head. All uses pass `toolchain: stable` or rely on the stable default. | keep (already latest). Comment suggestion: `# stable` |
| Swatinem/rust-cache | rust.yml:173,218,251,286,371 | `6323deb102c322ba6fcbdcafc7e3dddab59af2b6` | v2.9.2 | same SHA | none | keep. Comment suggestion: `# v2.9.2` |
| taiki-e/install-action | security.yml:44 | `e67fa11c4b9316fa714ddf0abed07a0c3143b95b` = **v2.87.4** (2026-09-02) | v2.87.26 (2026-10-06) | `f7e5d7c961414b23f5b25b2da9294395d08513ad` (`v2` = same) | 249 commits ahead. CHANGELOG 2.87.5 to 2.87.26 has only "Update `<tool>@latest` to x.y.z" manifest entries; no behaviour changes. `tool: cargo-audit@0.22.2` is version-pinned, so nothing changes. | `taiki-e/install-action@f7e5d7c961414b23f5b25b2da9294395d08513ad # v2.87.26` |
| peter-evans/create-pull-request | rust.yml:438; js.yml:595 | `5f6978faf089d4d20b00c7766989d076bb2fc7f1` | v8.1.1 | same SHA | none | keep |
| oven-sh/setup-bun | js.yml:309 | `0c5077e51419868618aeaa5fe8019c62421857d6` | v2.2.0 | same SHA | none | keep |
| denoland/setup-deno | js.yml:320 | `22d081ff2d3a40755e97629de92e3bcbfa7cf2ed` | v2.0.5 | same SHA | none | keep |
| rhysd/actionlint (docker) | workflows.yml:36 | `docker://rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667` | 1.7.12 (2026-03-30, still latest) | Docker Hub `1.7.12` and `latest` both = `sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667` | none. The pin is already 1.7.12. rhysd/actionlint#657 (`queue:` key) is still OPEN, so keep the `-ignore` workaround. | keep |
| zizmor (pipx) | workflows.yml:70,73 | `zizmor==1.30.1` | 1.30.1 (PyPI) | n/a | none | keep |
| PyYAML | scripts/requirements-ci.txt | `6.0.3` | 6.0.3 | n/a | none | keep |
| bun | js.yml:311 | `1.4.2` | bun-v1.4.2 (2026-09-05) | n/a | none | keep |
| deno | js.yml:322 | `2.9.6` | v2.9.7 (2026-09-17) | n/a | patch release | `2.9.7` |
| Node.js | js.yml:53 (`NODE_VERSION: 24.x`); rust.yml:282,367,483,523; docs.yml:43,66; security.yml:30; js.yml:293,637 | `24.x` | v24.21.0 (2026-09-07, LTS "Krypton", bundles npm 11.19.0); Current: v26.11.1 (2026-10-07, bundles npm 11.20.0, not LTS yet) | n/a | none | keep `24.x` |
| rust-script | docs.yml:47; js.yml:642 | `0.36.0` | 0.36.0 (2025-08-16) | n/a | none | keep |
| cargo-audit | security.yml:46 | `0.22.2` | 0.22.2 (2026-06-05, MSRV 1.88) | n/a | none | keep |
| npm | js/scripts/setup-npm.mjs:16-19,119,148,175 (`NPM_TARGET_MAJOR = 11`, recovery tarball `npm@11.20.0`, install `npm@11.20.0`); js/tests/release-metadata.test.js:107-114 | `11.20.0` | `latest` = 12.2.0 (2026-09-30); `next-11` = **11.21.0** (2026-09-30) | n/a | npm 12 has many breaking changes (see section 3). | Low-risk: `11.21.0`. npm 12 needs its own change, see section 3. |

## 2. Runner labels (task 4)

Source: `actions/runner-images` README (Available Images) and announcements.

- `ubuntu-26.04` is generally available. actions/runner-images#14747,
  "[Ubuntu] Ubuntu 26.04 and Ubuntu 26.04 Arm64 are now generally available",
  has a target date of Thursday, September 17, 2026. It ships Ubuntu 26.04.1 LTS
  with kernel 7.0.
- `ubuntu-latest` still maps to Ubuntu 24.04. README row:
  "`ubuntu-latest` or `ubuntu-24.04`". actions/runner-images#14748 says:
  "This change will be rolled out over a period of several weeks beginning October 19, 2026. We plan to complete the migration by November 19, 2026."
- Known 26.04 issues:
  - actions/runner-images#14777: `/tmp` is now a RAM-backed tmpfs with a ~7.8G
    per-user quota. Large builds can fail with "disk quota exceeded".
  - actions/runner-images#14797: `adduser` fails because of `/etc/skel` files.
  - actions/runner-images#14790: Docker blocks socketcall, so i386 containers
    have no network.

  None of these obviously affects this repo, which runs no large `/tmp` builds,
  no `adduser` and no i386 containers. The Docker publish job uses buildx;
  it should be smoke-tested.
- `macos-latest` = `macos-26` (arm64). `macos-15` (arm64) is still supported and
  not deprecated. Only macOS 14 is deprecated, fully unsupported from
  November 2, 2026.
- `windows-latest` = `windows-2025` (= `windows-2025-vs2026`).
- Ubuntu 22.04 images are being deprecated (#14254). Not used here.

The matrices in rust.yml:201-205 and js.yml:270-273 use `ubuntu-24.04`,
`macos-15` and `windows-2025`. Every other job uses `runs-on: ubuntu-24.04`:

| File | `runs-on` / matrix occurrences |
|---|---|
| docs.yml | 3 |
| js.yml | 18 |
| rust.yml | 14 |
| security.yml | 5 |
| workflows.yml | 4 |

Recommendation:
- `ubuntu-24.04` → `ubuntu-26.04`. It is GA and becomes `ubuntu-latest` from
  Oct 19 to Nov 19, 2026. Run the full CI on the PR to confirm.
- `macos-15` → `macos-26`. It is the current `macos-latest`.
- Keep `windows-2025`. It is already the latest.

Also update `experiments/update-issue-23-workflows.py:33,35` and
`experiments/complete-issue-23-workflows.py:20` only if those generators are
meant to stay in sync. They are historical experiment scripts.

## 3. npm 12 (task 6)

`npm view npm@12.2.0 engines` returns `{ node: '^22.22.2 || ^24.15.0 || >=26.0.0' }`.
Node 24.x currently resolves to 24.21.0, so the engine requirement is satisfied.
`setup-npm.mjs` still enforces `NODE_MIN_VERSION = '22.14.0'`; for npm 12 this
would need to become `22.22.2` / `24.15.0`.

Breaking changes in 12.0.0 (2026-07-08), quoted from the release notes:
- "npm view --json now always returns an array."
- "the --json output of `npm pack` and `npm publish` have changed. They are now always consistent, and in the same format."
- "`npm` now supports node `^22.22.2 || ^24.15.0 || >=26.0.0`"
- "allow-git and allow-remote now default to \"none\"; set them to \"all\" (or \"root\") to install git or user-supplied tarball-URL dependencies."
- "root `preinstall` now runs before dependencies are installed."
- "unknown configs in .npmrc, unknown CLI flags, abbreviated flags, and single-hyphen multi-char shorthands now throw instead of warning."
- "Dependency lifecycle scripts are now blocked by default unless allowed by the root package's `allowScripts` policy. After installing, run `npm install-scripts approve` to record approvals and `npm rebuild` to execute newly approved scripts."
- Other changes that don't affect this repo:
  - `npm shrinkwrap` was removed.
  - `npm adduser`, `star`, `stars` and `unstar` were removed.
  - `npm init` license now defaults to empty.
  - `npm sbom` cyclonedx naming changed.
  - `whichnode` was removed.

Provenance and OIDC: no breaking change. Relevant fixes in the 12.x line:
- 12.1.0: "provenance-file takes precedence over OIDC auto-generated provenance" (#9882).
- 12.2.0: "dist-tag: support OIDC authentication" (#10038).

Trusted publishing still works.

How this affects the repo:
- `changeset publish` (js/package.json:47) parses `npm info --json` and
  `npm publish --json`. Changesets issue #2164, "`npm info --json` array output
  in npm 12 breaks published-version detection in `changeset publish`", closed
  2026-07-15. Issue #2274 (the pnpm path) closed 2026-09-14. The lockfile has
  `@changesets/cli` 3.0.3 (2026-09-14), the latest release, which should
  include both fixes. Verify before switching.
- `js/package-lock.json` has one `hasInstallScript` package: `esbuild` 0.28.2
  (dev). Under npm 12 its postinstall would be blocked unless it is added to an
  `allowScripts` policy. esbuild resolves its platform binary via
  optionalDependencies, so this is probably harmless, but it needs a CI run.
- `setup-npm.mjs` hardcodes major 11 in three places:
  - `NPM_TARGET_MAJOR = 11`
  - the recovery tarball URL `npm/11.20.0` and the manifest check
  - the `npm install -g npm@11.20.0` command

  `js/tests/release-metadata.test.js:107-114` mirrors 11.20.0.
- Minimal, safe bump: 11.20.0 → 11.21.0 (`next-11`, 2026-09-30). Update the
  constants and the test fixture together.

  Moving to npm 12 means bumping `NPM_TARGET_MAJOR` and `NODE_MIN_VERSION`, and
  reviewing the `allowScripts` and `--json` consumers. Note that
  `setup-npm.mjs` returns early when the bundled npm (Node 24.21.0 bundles
  11.19.0) is already >= 11.5.1. In practice, then, the pinned version is only
  installed or recovered when the runner npm is older or broken.

## 4. CI policy rules affected (task 7)

`scripts/check-ci-policy.py` (36 lines) does not inspect action versions or
pinning. Its checks:
- the `pipeline-status` gate covers every job and uses `if: always()`
- workflow-level `permissions: {contents: read}`
- the `CANCELLABLE_JOBS` env matches the jobs with `cancel-in-progress: true`
- every job has `timeout-minutes`
- `cancel-in-progress` is the inverse of the writer role, and writers use `queue: max`
- every step that `startswith("actions/checkout@")` must set
  `persist-credentials` to exactly `contents == write`
- no `npm ci ||` fallback

Effect of the bumps: `actions/checkout@v7` still matches the
`actions/checkout@` prefix, so the `persist-credentials` invariant keeps being
enforced. The v7 default is unchanged, and the explicit values are already
present on all 40 occurrences. Changing runner labels touches none of the rules.

`.github/zizmor.yml` (`unpinned-uses` audit, run by zizmor 1.30.1 in
workflows.yml):
- `actions/*`, `github/*`, `docker/*` and `lycheeverse/*` use `ref-pin`. A tag
  such as `@v7` is allowed, and so is a SHA.
- Everything else (`'*'`) uses `hash-pin`. dtolnay, Swatinem, taiki-e,
  peter-evans, oven-sh, denoland and the `docker://` image must stay on full
  SHAs or digests.

So the taiki-e bump must use `f7e5d7c961414b23f5b25b2da9294395d08513ad`, not
`@v2`. A trailing `# v2.87.26` comment is allowed.

actionlint 1.7.12 is pinned by digest and still has the `queue` key gap
(rhysd/actionlint#657, OPEN), so the `-ignore` argument at workflows.yml:41
must stay.

## 5. Recommended edit list

1. `actions/checkout@v6` → `@v7` (40 places). No `with:` changes.
2. `actions/setup-node@v6` → `@v7` (21 places). No `with:` changes. The publish
   jobs (js.yml:464,530) use OIDC, which is unaffected by the `NODE_AUTH_TOKEN`
   removal.
3. `actions/upload-artifact@v6` → `@v7` (docs.yml:78).
4. `taiki-e/install-action@e67fa11c…` (v2.87.4) →
   `@f7e5d7c961414b23f5b25b2da9294395d08513ad` (v2.87.26) (security.yml:44).
5. `deno-version: 2.9.6` → `2.9.7` (js.yml:322).
6. Runner labels:
   - `ubuntu-24.04` → `ubuntu-26.04` (GA 2026-09-17).
   - matrix `macos-15` → `macos-26`.
   - keep `windows-2025`.
7. npm: 11.20.0 → 11.21.0 in `js/scripts/setup-npm.mjs` and
   `js/tests/release-metadata.test.js`. Alternatively, plan npm 12 separately
   (section 3).
8. No change needed for:
   - dtolnay/rust-toolchain: already the `stable` head
   - Swatinem, peter-evans, setup-bun, setup-deno
   - the actionlint digest
   - codeql v4, lychee v2, Pages actions, dependency-review v5, the docker/* majors
   - rust-script 0.36.0, cargo-audit 0.22.2, bun 1.4.2, zizmor 1.30.1, PyYAML 6.0.3
