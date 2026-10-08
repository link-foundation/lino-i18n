# Complete CI/CD template comparison

The pinned [JavaScript tree](templates/js-file-tree.txt) contains 428 files and the [Rust tree](templates/rust-file-tree.txt) contains 171. [full-tree-comparison.csv](templates/full-tree-comparison.csv) assigns every one of these 599 paths a category, source blob, archive status and local application. [preserved-files.json](templates/preserved-files.json) records actual source bytes and SHA-256 checksums, including added configuration and regression-test files beyond the collector's initial selection. The complete [local CI inventory](github/current-ci-file-tree.txt) includes all workflow, composite-action, hook and helper paths.

## Workflow comparison

| Template files | Local implementation | Difference justified by this repository |
| --- | --- | --- |
| JS `release.yml` | `.github/workflows/js.yml` | npm trusted-publisher identity requires retaining `js.yml`; package lives under js/; guarded automatic, fragment-PR and instant releases retained |
| Rust `release.yml` | `.github/workflows/rust.yml` | Cargo workspace under rust/, macro/runtime dependency order and language-prefixed tags; warnings-denied compilation of all helpers |
| Both `links.yml` | `.github/workflows/docs.yml` | One product-link policy and shared tested recheck; both generated sites validated together |
| Both `workflows.yml` | `.github/workflows/workflows.yml` | Digest-pinned actionlint image includes ShellCheck/Pyflakes; shared Python coverage/security/concurrency policy; annotated zizmor |
| Both `security.yml` | `.github/workflows/security.yml` | npm and Cargo audits, dependency review and JS/Rust/Actions CodeQL in one workflow |
| JS `example-app.yml` | Existing tests/examples retained | No template demonstration app exists in this library; importing an unrelated app release would not validate lino-i18n |
| Rust `desktop-release.yml` | Existing package workflows retained | This project publishes libraries, not a desktop executable; no desktop artifacts or packaging contract |
| Both buildx actions and JS Docker publisher | `.github/actions/publish-dockerhub/action.yml` | Existing optional reusable capability preserved, layer caching added, platform input documents native-runner requirement; no active Dockerfile or image publication |
| Both CodeQL/zizmor configs | `.github/codeql/`, `.github/zizmor.yml` | Product/workflow analysis excludes archived evidence and generated output; reviewed publishers may use release tags, others immutable hashes |

## Helper and configuration comparison

| Concern and reviewed template components | Adaptation |
| --- | --- |
| `pr-comparison`, `detect-code-changes`, language paths, fragment/version guards | Shared JS comparison and Rust git-changes modules; whole PR/push ranges; strict errors; workspace/member manifests; semantic versions; genuine added fragments |
| `release-metadata`, `version-and-commit`, push classifiers/retry, release naming | Shared semantic Python metadata validator, clean sync before mutations, metadata-only rebase, classified bounded push retry, outputs only after push; existing js-v/rust-v conventions |
| `npm-registry`, `publish-retry`, publish classifier, npm setup/sanitization | Exact registry reads and one accepted write; stage guidance; retained npm recovery with verified archive integrity; no unpinned remote evaluation |
| Rust registry/release helpers and release-index | Shared exact-version registry-state module and deterministic macro/runtime order; existing Cargo commands kept locked |
| `crates-publish-preflight`, preflight credentials | Reused invalid-payload crates probe and its tests, shared shell entry point; npm OIDC support check with explicit binding/approval proof limits |
| `check-pipeline-status`, cancellation map, coverage guard | One tested shared gate covering every job in every workflow; unknown/cancelled writers fail; superseded read-check cancellation requires remote head proof |
| `recheck-broken-links`, Web Archive helper/tests/fixture | Reused current helpers and suites with docs.yml paths; final verdict considers original full report, including unrecovered final errors |
| File size, syntax, required docs and budget helpers | Shared tracked-code limits; complete JS syntax and Rust-helper compile/unit checks; required docs validation; finite request/poll/job budgets |
| Hooks, staged formatting, lint helpers | Optional local hook covers formatting, lint, types, limits and secrets using existing package checks; installation documented |
| ESLint/Prettier/jscpd/secretlint and package managers | Existing configs preserved/refined; real duplication formats and empty-scan failure; strict locked installs; pinned development upgrades; runtime engines unchanged |
| Debug/log helpers | Default-off DEBUG and PIPELINE_STATUS_VERBOSE plus contextual command/registry errors; avoid a new logging dependency solely for CI |
| Package smoke tests | Existing package, type, CLI/browser and Cargo packaging checks retained; release fixtures test actual publication preparation without externally publishing |
| Template product tests/source/examples and historical case studies | Complete tree classified; relevant CI tests preserved as references; unrelated demonstration implementations and old evidence are not copied into the product |

Both templates contain similar infrastructure but assume a single package root. Direct copying would lose this repository's subdirectory/workspace behavior, trusted-publisher filename, public APIs or combined documentation site. The implementation therefore reuses tested standalone components where their contracts match and applies reviewed patterns to existing helpers elsewhere.

Two upstream findings were reviewed against the pinned current trees. The JavaScript template already fixed the duplicate-write path and malformed changeset handling; its staging explanation needed the additional account-approval evidence linked in [SOURCES.md](SOURCES.md). Rust output-write failure still reproduced and was reported as issue 192. The mapping does not claim the templates themselves are defect-free.
