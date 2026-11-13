# Primary sources and reproducibility

All metadata was retrieved online on November 13, 2026; `registry/latest.json` preserves the exact registry URLs and selected release metadata for each npm/crates.io package. Tables distinguish a registry release from an upstream source edit that has not been published.

| Topic | Primary source | Decision / saved evidence |
| --- | --- | --- |
| Issue and later CI feedback | https://github.com/link-foundation/lino-i18n/issues/43 | Full issue/comment/sub-issue snapshots in `github/`; all prose requirements mapped in PLAN.md. |
| Dependency-update practices | https://github.com/link-assistant/hive-mind/blob/main/docs/DEPENDENCY-UPDATE-BEST-PRACTICES.md | Retrieved and reviewed; compatible lock updates alone are insufficient for major migrations. |
| npm 12 release / migration | https://github.com/npm/cli/releases/tag/v12.0.0 and https://github.com/npm/cli/blob/latest/CHANGELOG.md | Keyed pack/publish JSON, Node patch floors and script approval; saved release body and changelog. |
| Latest npm CLI release | https://github.com/npm/cli/releases/tag/v12.2.2 | Compared GitHub release with npm registry latest; separately audited the official bundle. |
| Maintained semantic version operations | https://github.com/npm/node-semver | Adopted semver's comparison and range matching instead of a local parser. |
| Node 26 major migration | https://nodejs.org/en/blog/release/v26.0.0 | Reviewed removed HTTP/stream/crypto APIs; runtime and CLI tests use supported APIs. Node release metadata preserved in tool snapshot. |
| Current Node metadata | https://nodejs.org/dist/index.json | Stable current LTS versus prerelease classification; rolling CI pins request the latest patch. |
| Python 3.15 porting | https://docs.python.org/3.15/whatsnew/3.15.html#porting-to-python-3-15 | Reviewed removals, UTF-8 default, import loading and sqlite changes; existing scripts do not use removed interfaces. |
| Current Python releases | https://www.python.org/ftp/python/ | Verified 3.15.2; PyPI data for PyYAML, zizmor and pip-audit is preserved in tool snapshot. |
| Current Rust edition | https://doc.rust-lang.org/edition-guide/rust-2024/index.html | Edition 2024 already current; compiler floor raised for actual optional dependency requirements. |
| Links Notation | https://github.com/link-foundation/links-notation/blob/main/CHANGELOG.md | Parser/formatter, published grammar and MSRV changes reviewed; snapshot saved. |
| Codec API changes | https://github.com/link-foundation/lino-objects-codec/blob/main/js/CHANGELOG.md | Current JS codec now uses current parser; Rust registry lags its source. |
| CLI/environment changes | https://github.com/link-foundation/lino-arguments/blob/main/js/CHANGELOG.md | Current CLI keeps an older published environment API; source manifests and registry ranges compared. |
| Workflow tool installer | https://github.com/actions/setup-node/blob/main/action.yml | `check-latest` exists; no npm-version installation input exists. |
| Workflow ad-hoc package audit | https://docs.zizmor.sh/audits/#adhoc-packages | Precise CLI installation annotation; application lockfile checks remain required. |
| Docker image digest | https://registry-1.docker.io/v2/rhysd/actionlint/manifests/latest | Registry manifest digest equals pinned 1.7.12 image, recorded in `registry/docker-image.json`; no image pull. |
| glob advisory | https://github.com/advisories/GHSA-3g3m-2fjr-6pw4 | Latest npm's bundled glob is in the affected range; fixed upstream library release exists. |
| minimatch advisory | https://github.com/advisories/GHSA-g3hv-75wg-m249 | Latest npm's bundled minimatch is in the affected range; fixed upstream library release exists. |
| Upstream collectors | https://github.com/generaltranslation/gt/blob/main/packages/rrweb/src/harvest.ts | Verified the marked-text coverage workaround is still necessary; bounded reproduction and upstream report saved. |
| Alternative updater | https://docs.renovatebot.com/ | Considered for regex/tool updates; existing Dependabot service retained to avoid overlapping automation. |

`action-releases.json` and `tool-releases.json` preserve release tags, resolved immutable commits and release dates. Each package's registry response is the authority for its current version; these source links explain migrations rather than substituting memory for registry resolution.

Re-run the light collectors with `python experiments/issue-43-registry.py after`, `python experiments/issue-43-tools.py`, `node experiments/issue-43-npm-parents.mjs`, then `python experiments/issue-43-tables.py`. Regenerate the separate bounded npm CLI audit with `python experiments/issue-43-npm-bundle.py` using the documented npm 11 metadata reader. Use `--refresh` on the registry collector to refresh all package metadata; without it, only missing packages are fetched.

Run suites sequentially through `experiments/issue-43-verify.py js|rust|workflow` with the desired Python/npm binaries on PATH. CI covers framework/browser builds and the full OS/runtime/MSRV matrix. Do not run resource-exhaustion advisory payloads: the finite metadata probe establishes affected versions without stressing the host.
