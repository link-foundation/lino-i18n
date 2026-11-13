The merged Dependabot updates left release-fragment checks failing and copied an obsolete crates.io auth action SHA into a regression fixture. This PR preserves those updates, repairs the checks, and refreshes direct/transitive dependencies, release helpers, Actions and toolchains across the live repository.

- Update JS/TS and Rust manifests and locks, including both workspace members, optional peers and rust-script manifests. PyYAML is already latest; detected Ruby consists only of archived research, so no live Bundler manifest is needed.
- Migrate CI/release tooling to npm 12.2.2 and its keyed pack JSON. Replace the handwritten version comparator with maintained semver; test supported Node patch floors and preserve verified npm recovery. Use Node 26, current Bun/Deno/Python, and one tested Rust 1.92 floor including ICU.
- Prepare JS and Rust minor releases, preserve release race/auth safeguards, and add Python auditing while enforcing all application vulnerability severities.

### Reproduction and validation

`python experiments/issue-43-crates-auth-baseline.py` reproduces the three original copied-SHA failures; `python experiments/issue-29-crates-auth.py` passes all eight tests after the fix. Existing package metadata verification exercises npm 12's actual pack output. New bootstrap tests exercise npm 11 upgrades and unsupported Node patch versions.

Local validation passes: 197 JS tests, types, lint, formatting, duplication, secrets and package dry-run; Rust all-feature build/tests/doctests/docs, fmt and Clippy with warnings denied; workflow/pin/auth/archive/hook regressions and both zizmor modes. Application npm, Cargo and Python audits report zero advisories. Existing CI verifies browser/framework builds and full OS/runtime/MSRV matrices. Final-head CI is tracked in the PR checks.

### Research, complete inventory and upstream reports

The [requirement plan](https://github.com/link-foundation/lino-i18n/blob/issue-43-cd9fbfad1206/dev/log/issues/43/pulls/44/PLAN.md), [deep analysis](https://github.com/link-foundation/lino-i18n/blob/issue-43-cd9fbfad1206/dev/log/issues/43/pulls/44/ANALYSIS.md), [primary sources](https://github.com/link-foundation/lino-i18n/blob/issue-43-cd9fbfad1206/dev/log/issues/43/pulls/44/SOURCES.md), [registry tables](https://github.com/link-foundation/lino-i18n/tree/issue-43-cd9fbfad1206/dev/log/issues/43/pulls/44/registry), reproductions, original failure logs/checksums and verification results are under `dev/log/issues/43/pulls/44`. Every retained older transitive version has an explicit parent compatibility/publication reason.

- [npm CLI bundled advisories](https://github.com/npm/cli/issues/10299): new finite audit reproduction and supported-upgrade request.
- [Rust codec publication gap](https://github.com/link-foundation/lino-objects-codec/issues/84): current source migration needs a new immutable crate release.
- [Environment publication/range follow-up](https://github.com/link-foundation/lino-env/issues/33#issuecomment-6866277754) and [arguments coordination follow-up](https://github.com/link-foundation/lino-arguments/issues/46#issuecomment-6866278320): latest published parents still select the old parser.
- [rrweb marked-variable fallback](https://github.com/generaltranslation/gt/issues/2791): new minimal reproduction and proposed ownership-based coverage fix; existing downstream workaround/regression retained.
- Existing [actionlint queue schema](https://github.com/rhysd/actionlint/issues/657), [runner schema](https://github.com/rhysd/actionlint/issues/682), and [lychee connect retry](https://github.com/lycheeverse/lychee/issues/2297) reports still explain the necessary narrow workarounds.

### Unfinished acceptance criteria — keep unmerged

The **tooling security requirement remains blocked**: registry-latest npm 12.2.2 itself bundles glob 13.0.6 and minimatch 10.2.5 matching two public advisories. The separately audited CLI tree reports 21 moderate package findings from those advisories. Consumer overrides leave the bundled versions unchanged. A clean application audit and green PR CI do not resolve this upstream tool issue; a supported fixed npm bundle and a fresh tool audit are still required.

The latest fetched `main` is integrated into this branch. **Default-branch CI cannot be claimed green until the reviewed fix is merged and its main runs succeed.** This PR is left unmerged; no release is published by this work.

Closes #43
