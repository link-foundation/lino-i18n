# Issue 43 / PR 44 work plan

Objective: implement and verify all issue requirements in this single, unmerged PR. Work only on `issue-43-cd9fbfad1206`; preserve history and use bounded, sequential builds within 2.92 GiB.

## Requirement inventory and verification

| ID | Requirement | Proposed solution | Verification / evidence |
| --- | --- | --- | --- |
| R1 | Read complete issue, comments, required sub-issues, PR conversation, inline comments and reviews | Preserve API snapshots; inspect feedback and refresh before finalization | `github/`; no required sub-issues were present initially |
| R2 | Fix every failure caused by merged Dependabot PRs 31, 38, 42; retain updates | Download actual main logs, reproduce failures, fix causes without reverting updates | baseline logs; regression fixtures; all current-commit workflows |
| R3 | Update JS/TS first: all runtime/dev/peer deps and transitive locks, including majors | Registry inventory; npm-check-updates; deliberate migrations; regenerate lock | complete before/latest/after tables; npm outdated, full tests/types/lint/build/browser checks |
| R4 | Update Rust second: workspace, both members, transitive deps, standalone rust-script manifests; revisit edition/MSRV | crates.io inventory; compatible/incompatible manifest changes and cargo update; synchronize duplicate pins | Cargo/helper checks, tests, fmt, Clippy, package checks and tested floor |
| R5 | Update Python third: requirements and tool versions | PyPI inventory, exact CI requirements; current Python in CI | Python fixtures, pip-audit; workflow CI |
| R6 | Inspect Ruby and add missing manifest only if executable Ruby needs dependencies | Determine whether Ruby is product/build code or archived upstream research | source inventory and documented result; Bundler audit if applicable |
| R7 | Update all Actions, composites, reusable workflows, base images and language/toolchain pins | Query release APIs and image registry; align every live pin | action/tool tables, dependency pin guard, actionlint, zizmor |
| R8 | Keep Dependabot aligned with every live ecosystem/directory | Check workspace member discovery and composite coverage; add entries for new manifests | parsed configuration and regression checks |
| R9 | Every direct/transitive dependency has before/current registry table; every retained older version has a reason | Reusable low-memory registry collector with complete per-ecosystem tables | `registry/` snapshots and reports, migration notes and exceptions |
| R10 | Read changelogs/migration guides for major bumps, adopt upstream replacement features and remove obsolete shims | Research primary upstream sources; inspect call sites and workarounds throughout live code | migration analysis, diff, targeted regressions |
| R11 | Honest floors/current upper bounds and consistent pins; regenerate every lock | Raise outdated declared floors deliberately and validate supported versions | synchronized manifests, lockfile freshness, floor legs and pin guard |
| R12 | Full build, test, lint suites; no introduced deprecations; audits with no unresolved advisories | Run low-memory local checks sequentially and use CI for heavy builds/matrices; investigate every failure | `verification/`, `ci-logs/`, final current-SHA checks and annotations |
| R13 | Report dependency bugs/missing features/duplicated general logic upstream | Search existing issues; add minimal reproducible reports or evidence to existing reports; retain needed workarounds | linked upstream reports and local regression evidence |
| R14 | Follow dependency update best practices; preserve all existing features | Read supplied practices and compare merged PR style; review full PR diff | `research/`, self-review and requirement mapping |
| R15 | Prepare releases and final PR | JS changeset and Rust fragment; update PR title/body, positive `Closes #43`, include tests/reports; remove task placeholder | release guards, clean worktree, pushed branch, PR ready |
| R16 | Integrate latest main and make all CI green, including default branch failures | Fetch/merge main into PR; fix same defects in PR; verify merged-state CI | ancestry check, current-head CI; default-branch publication state tracked explicitly |
| R17 | Collect research/data/analysis in requested folder and search online for existing components | Save sources, alternatives, requirement mapping, immutable baseline and verification | this directory and reusable experiments |

## Sequence

1. [done] Collect feedback, baseline failures, complete dependency inventory and primary-source research.
2. [done] Implement migrations in ecosystem order; fix regressions and add release fragments; commit useful atomic steps.
3. [done, final-head CI pending] Run full required checks with bounded resources; push and investigate all current-SHA CI failures.
4. [in progress] Refresh feedback and registry freshness; finish upstream reports, review diff and PR metadata, ensure clean tree, mark ready.

## Acceptance mapping

| Requirements | Implementation and verification status |
| --- | --- |
| R1 | Complete API snapshots read; no required sub-issues or new PR feedback at the refreshed snapshot. |
| R2 | Reproduced copied auth-SHA failures, added release fragments, preserved release-race validation. Original and first refreshed failure logs retained; final-head CI tracked separately. |
| R3, R4, R5 | Current direct npm/Cargo/Python dependencies and regenerated locks; workspace, both members, standalone helpers, optional peers and supported floors included. Explicit parent compatibility exceptions are inventoried. |
| R6 | Verified Ruby is archived upstream evidence only; no runtime dependencies or missing manifest. |
| R7, R8, R11 | Current action/tool/language/image pins; exact pin guards; MSRV includes ICU; current Node patch resolution; existing Dependabot covers all live manifests and composites. |
| R9, R10 | Complete registry tables including the separate npm tool bundle; reviewed major migration notes; adopted maintained semver instead of custom code. |
| R12 | Application suites/audits pass. **Unfinished: official latest npm tool bundle has two unresolved public advisories; npm/cli#10299.** Final-head CI must also pass. |
| R13 | New npm, codec-publication and gt-rrweb reports, updated env/arguments reports, and existing actionlint/lychee reports linked in ANALYSIS.md. Local protective workarounds retained. |
| R14, R17 | Supplied dependency practices reviewed; full source diff reviewed; research, alternatives and reproducible experiments preserved. |
| R15 | Minor changeset and Rust fragment committed; actual PR description/title, clean worktree and ready state finalized after checks. |
| R16 | Latest fetched main is already an ancestor. **Unfinished: default-branch CI remains a post-merge condition; PR is intentionally unmerged.** |

See `ANALYSIS.md` for failure line numbers, proposed/applied alternatives, test evidence, retained constraints and exact external blockers. The native goal remains active; it is not marked achieved while the two unfinished acceptance criteria remain.

## Scope assumptions

- Historical snapshots under `docs/case-studies` and previous `dev/log/issues` are evidence, not executable dependency manifests. Do not rewrite past evidence to pretend it was current.
- The only Ruby files found initially are archived copies of Dependabot source under issue 26 research. Confirm before deciding a Gemfile is needed.
- No direct default-branch pushes or PR merges are authorized. Verify fixes on the latest main merged into this PR; distinguish that from claiming main already contains an unmerged fix.

## CI investigation protocol

List recent branch runs with timestamps and SHAs, compare them to the latest commit, download each non-passing run into `ci-logs/`, read the failing steps in chunks no larger than 1500 lines, and record exact errors with log line numbers. Never diagnose a newer commit from stale runs. Preserve downloaded logs compactly with a checksum index before finalization.
