# Issue 8 Case Study: CI/CD False Positives After Issue 5 Fix

## Scope

Issue: https://github.com/link-foundation/lino-i18n/issues/8

Prepared PR: https://github.com/link-foundation/lino-i18n/pull/9

The issue reported that after the issue 5 / PR 7 rollout the JavaScript and Rust workflows still failed on `main`:

- JavaScript run https://github.com/link-foundation/lino-i18n/actions/runs/25972666215 — the `Publish npm Package and GitHub Release` job failed in `Publish to npm`.
- Rust run https://github.com/link-foundation/lino-i18n/actions/runs/25972666223 — the `Deploy Rust Docs` job failed in `actions/deploy-pages@v5`.

The requested outcome was to identify the false positives and real errors, compare the workflows against the upstream language pipeline templates, reuse the best patterns, archive every relevant log/data file under `docs/case-studies/issue-8`, and report defects upstream only where the templates themselves still carry the bug.

## Saved Evidence

Raw data and logs are saved under [`data/`](data/):

- `rust-25972666223-failed.txt` — full failed-step log for `actions/deploy-pages@v5`.
- `rust-25972666223-summary.txt` — `gh run view` summary listing the failing step and annotations for the Rust run.
- `js-25972666215-failed.txt` — full failed-step log for `Publish to npm`, including all three retry attempts.
- `js-25972666215-summary.txt` — `gh run view` summary listing the failing step and lint annotations for the JavaScript run.

## Timeline

- 2026-05-16 ~20:52 UTC: PR 7 merge landed the new full-lifecycle JS and Rust workflows on `main`.
- 2026-05-16 20:54:59 UTC: JavaScript run 25972666215 reached the `Publish to npm` step. The first publish attempt returned `npm error 404 Not Found - PUT https://registry.npmjs.org/lino-i18n`. The script retried twice (per `publish-to-npm.mjs` MAX_RETRIES=3) and each retry returned the same 404. The job exited with code 1.
- 2026-05-16 20:56:13 UTC: Rust run 25972666223 reached `actions/deploy-pages@v5`. The action immediately failed with `Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable` and printed `Ensure GITHUB_TOKEN has permission "id-token: write".`.
- 2026-05-16 ~20:58 UTC: issue 8 was opened with both failing run URLs and a request to compare against the four AI-driven-development pipeline templates.
- 2026-05-16 21:17 UTC: working directory was prepared and branch `issue-8-ca918c4d7d4c` checked out for PR 9.
- 2026-05-16 21:19-21:24 UTC: logs for both failing runs were captured under `docs/case-studies/issue-8/data/`.

## Requirements

From the issue body:

- Check both failing CI runs for false positives and real errors.
- Compare this repo's workflows against the four upstream language templates: `js-ai-driven-development-pipeline-template`, `rust-ai-driven-development-pipeline-template`, `python-ai-driven-development-pipeline-template`, `csharp-ai-driven-development-pipeline-template`.
- Reuse best practices from those templates.
- Download and archive all logs and data under `./docs/case-studies/issue-8`.
- Produce a deep case study (timeline, requirements, root causes, proposed solutions) using the saved data.
- Add debug output or verbose mode when the available data is not enough to root-cause a problem.
- Report shared defects upstream to the template repositories with reproducible examples, workarounds, and suggested fixes — but only when the defect actually exists in the templates.

## Root Causes

### 1. Rust Pages deploy missing `id-token: write` permission

`.github/workflows/rust.yml` had no per-job `permissions:` block on the `deploy-docs` job. The workflow-level `permissions:` block intentionally grants only `contents: read` (it is the minimum default to keep other jobs safe). `actions/deploy-pages@v5` mints a GitHub OIDC token by calling `getIDToken()` on `@actions/core`, which reads `ACTIONS_ID_TOKEN_REQUEST_URL` from the environment. That env variable is only injected when the job's `GITHUB_TOKEN` has `id-token: write`, so the action threw:

```
Error: Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable
##[error]Ensure GITHUB_TOKEN has permission "id-token: write".
```

See `data/rust-25972666223-failed.txt` lines 21 and 32. This is a real error, not a false positive.

### 2. JavaScript `Publish to npm` step skipping the npm upgrade

`.github/workflows/js.yml` ran `actions/setup-node@v6` with `node-version: 24` and then jumped directly from `npm ci || npm install` to `Check pending changesets` / `Publish to npm`. The npm 10.x that ships with Node.js 24 does not support npm OIDC trusted publishing (added in npm 11.5.1). When changeset invokes `npm publish` without a static `NODE_AUTH_TOKEN` and without OIDC support, the registry rejects the PUT request. npm's CLI reports unauthenticated PUTs as `404 Not Found - PUT https://registry.npmjs.org/lino-i18n` to avoid leaking package existence (see `logs/js-25972666215-failed.log` line 35).

See `data/js-25972666215-failed.txt` for the full `PUT … 404` retry sequence. The repository already ships `js/scripts/setup-npm.mjs`, a multi-strategy upgrader (npm install → curl tarball → npx → corepack) copied from the JS template. The workflow simply did not call it before the publish step. This is the second real error, not a false positive.

### 3. Lint annotations on the JS run

The lint job emitted four warnings (`require-await` on `loadLocaleFromString`, complexity on `resolveKey`, `commandCheck`, `commandConvert`). These were not the cause of the publish failure — the lint job passed and the publish job failed independently — but they appear in the run annotations and so could be confused for the failure. They are out of scope for "fix CI/CD" because they are non-blocking, and rewriting public APIs to satisfy `require-await` would change behavior and break tests.

## Template Assessment

Both root causes are local to `lino-i18n`. The upstream templates already implement the correct patterns:

- `rust-ai-driven-development-pipeline-template/.github/workflows/release.yml` declares a per-job `permissions: { contents: read, pages: write, id-token: write }` on its docs-deploy job. The Pages OIDC permission is part of the template.
- `js-ai-driven-development-pipeline-template/.github/workflows/release.yml` calls `node scripts/setup-npm.mjs` between `npm ci` and the changeset publish step in the release job. The npm-upgrade flow is part of the template.

PR 2 (the original migration into `js/` and `rust/`) deleted the original release workflow; PR 7 reintroduced almost everything but missed these two fragments. The bug is therefore an integration regression in this repo, not an upstream template defect.

No upstream issue is being opened because the defect does not reproduce in the templates and the suggested workarounds (the per-job permission block and the setup-npm step) are already the templates' default behavior.

## Implemented Solution

### Rust workflow (`.github/workflows/rust.yml`)

Added a per-job `permissions:` block to the `deploy-docs` job:

```yaml
deploy-docs:
  name: Deploy Rust Docs
  permissions:
    contents: read
    pages: write
    id-token: write
```

A multi-line comment above the job documents why the workflow-level `permissions:` block keeps `id-token: write` off by default and why `deploy-docs` opts in.

### JavaScript workflow (`.github/workflows/js.yml`)

Inserted `node scripts/setup-npm.mjs` between `npm ci || npm install` and the publish flow in both publishing jobs:

- `auto-release` — the `push`-triggered job that runs changeset publish.
- `manual-release` — the `workflow_dispatch` instant-release job.

A comment above the `auto-release` step explains the Node 24 / npm 10 / OIDC interaction so the workaround does not get removed by a future cleanup.

### Why the workflow already had the script

`js/scripts/setup-npm.mjs` was carried over from the JS template by PR 6 / PR 7 but never wired into the workflow. The fix is one workflow step per publishing job; no new script and no script changes are required.

## External References

- npm trusted publishing requires npm 11.5.1: https://docs.npmjs.com/trusted-publishers
- `actions/deploy-pages` OIDC requirement: https://github.com/actions/deploy-pages#usage
- GitHub Pages custom workflows: https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- npm CLI reports unauthorized PUT as 404: https://docs.npmjs.com/cli/v10/commands/npm-publish (see "Errors" section)
- GitHub Actions OIDC token environment variables: https://docs.github.com/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect

## Verification

- YAML parse for both edited workflows.
- `git diff` review of the two workflow edits.
- Re-read of the failure logs in `logs/` to confirm the root cause keywords map to the implemented fix.

CI runs on PR 9 will produce the post-fix evidence that the publish job and the deploy-docs job both reach success on a clean push to `main`.
