# Sanity integration investigation

Sanity integration is deferred. The current package has no `lino-i18n/sanity`
export. A working candidate and its reproducing tests are preserved in
[commit 0e7443a](https://github.com/link-foundation/lino-i18n/commit/0e7443aa54814e1e30ea6ca0fdc655372c24bc72),
but its dependency graph failed the existing security gate.

## Contract evidence

The candidate uses actual `gt-sanity` 4.0.24 exports, Sanity/schema/mutator
6.18.0 and a real Sanity client's revision-guarded mutation against a loopback
HTTP server. All seven runtime contract tests and positive/negative consumer
types passed locally and in the candidate's
[JavaScript workflow](https://github.com/link-foundation/lino-i18n/actions/runs/37857389183).
This is evidence about the candidate, not coverage of a shipped integration.

The regressions reproduced GT's regenerated Portable Text span keys and its
silently omitted translated blocks when target array keys were absent. The
candidate restores unambiguous span keys, rejects missing target blocks, binds
catalogs to source revisions, permits only text-node changes, preserves schema
exclusions and prepares explicit target revision-guarded patches. Its JSON/HTML
processing has finite byte/node/depth budgets and a 1,000-item array limit.
The tests, fixture manifest, lockfile and original usage guide remain at the
candidate commit. To reproduce, use a separate checkout of that revision, then
run these commands from `js/`:

```sh
npm ci --prefix examples/sanity-usage --install-links
npm --prefix examples/sanity-usage test
npm --prefix examples/sanity-usage run test:types
```

That historical checkout installs the vulnerable graph described below.
Authenticated Studio permissions, hosted translation and document publication
were not tested. GT's current TranslationsTab retains its own hosted provider;
its exported legacy Adapter type does not make it accept arbitrary catalogs.

## Dependency review blocker

The candidate's
[Security workflow](https://github.com/link-foundation/lino-i18n/actions/runs/37857389186/job/113584744669)
failed on 2026-10-08 for `braces@3.0.3` in the fixture lockfile. The downloaded
full log reports the package at line 4360 and the vulnerable-package error at
line 4362. GitHub's
[reviewed advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
lists affected versions through 3.0.3 and no patched release.

The resolved dependency paths are:

```text
sanity@6.18.0 -> @sanity/cli@8.16.0 -> @sanity/codegen@8.2.0
  -> chokidar@3.6.0 -> braces@3.0.3
  -> globby@11.1.0 -> fast-glob@3.3.3 -> micromatch@4.0.8 -> braces@3.0.3
```

The [saved audit](case-studies/issue-25/data/sanity-advisories.json) contains 19
Studio/CLI findings, nine high and ten moderate. The
[investigation record](case-studies/issue-25/data/sanity-investigation.json)
preserves versions, CI references and the attempted alternatives.

Upgrading the research version from Sanity 6.9.2 to current 6.18.0 avoided a
[Portable Text data-loss defect](https://www.sanity.io/docs/changelog/studio-Ni4xNC4w)
but retained vulnerable glob dependencies. The latest compatible CLI and codegen
releases still use these dependencies. `gt-sanity` 4.0.24 requires Sanity major 6;
downgrading to major 5 would violate that contract. A chokidar major override
would remove glob support expected by codegen, while the latest globby still
depends on the affected fast-glob/micromatch path. Isolating the fixture kept
core's audit clean but did not pass repository dependency review.

The candidate was reverted without changing the security threshold or adding
an advisory exception. The pinned upstream sources, audit and
[declaration diagnostics](case-studies/issue-25/data/sanity-type-errors.txt)
remain in the case study. Upstream Studio declarations also required
`skipLibCheck` in the candidate; core's five type suites retain library checks.

## Resuming implementation

Revisit the compatible upstream dependency graph after a reviewed patch is
available. Reapply the candidate, refresh its lockfile, rerun all seven contract
tests and strict consumer types, and require audit/dependency review to pass.
Then validate authenticated Studio permissions and publication, and define a
separate contract for internationalized-array catalog transport. The candidate
only covered document and legacy field localization; full GT parity remains
listed in the [requirement matrix](case-studies/issue-25/REQUIREMENTS.md).
