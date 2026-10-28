# crates.io publishing

The Rust workflow publishes `lino-i18n-macros` before `lino-i18n`. Both automatic
releases on `main` and manual instant releases try trusted publishing first,
then fall back to `CARGO_REGISTRY_TOKEN`, then `CARGO_TOKEN`. Keep both fallback
secrets configured and rotate them as needed. This follows the
[October 13 policy update](https://github.com/link-foundation/lino-i18n/issues/29#issuecomment-6150017413).

## Trusted publisher identity

Register this identity separately in each crate's crates.io settings:

| Setting | Value |
| --- | --- |
| Crates | `lino-i18n-macros` and `lino-i18n` |
| Publisher | GitHub Actions |
| Repository owner | `link-foundation` |
| Repository name | `lino-i18n` |
| Workflow filename | `rust.yml` |
| Environment | `crates.io` |

Use the top-level workflow filename, without `.github/workflows/`. All three
authentication jobs use the same `crates.io` environment. A publisher registered
for only one crate cannot authorize the other. Renaming the workflow or
environment requires updating both crate registrations.

A crate owner can inspect both registrations using:

```bash
# Supply an owner token through CARGO_REGISTRY_TOKEN or CARGO_TOKEN.
# The token needs the trusted-publishing endpoint scope for both crates.
python3 experiments/issue-29-register-trusted-publishers.py

# Add missing registrations and verify them by reading the API response back.
python3 experiments/issue-29-register-trusted-publishers.py --execute
```

The helper preserves existing registrations and never deletes secrets. The
original issue's token-deletion migration step is superseded by the policy
update; do not run a migration that removes the fallback secrets. Upstream
automation changes are tracked in
[package-registry-manager #60](https://github.com/link-foundation/package-registry-manager/issues/60)
and [#62](https://github.com/link-foundation/package-registry-manager/issues/62).

## Authentication and preflight

The standalone release preflight, automatic release, and manual release jobs each
request `id-token: write` and run the pinned `crates-io-auth-action` v1.0.5. Its
temporary token is local to that job; the standalone preflight's token is never
passed between jobs. Authentication failure allows the token fallback. Successful
OIDC authentication takes precedence even when fallback secrets are present.

Every preflight and publish step uses this ordered expression:

```yaml
CARGO_REGISTRY_TOKEN: ${{ steps.crates_auth.outputs.token || secrets.CARGO_REGISTRY_TOKEN || secrets.CARGO_TOKEN }}
```

The existing preflight validates the selected credential against both crates
before versioning. It submits metadata without an archive, so it cannot publish a
version. Missing credentials or rejection of either crate fails the preflight;
OIDC request variables alone do not prove registry authorization. If the chosen
OIDC token is rejected by the preflight or real publish, the job fails instead of
silently retrying with a different identity. Actual ownership and successful
publication remain checks made by crates.io during publishing.

This workflow has no `workflow_call` interface. If it becomes reusable, declare
both fallback secrets as optional and grant OIDC permission in its caller too.

## Verification

Run the offline regressions and existing probe tests:

```bash
python3 -m pip install --requirement scripts/requirements-ci.txt
python3 experiments/issue-29-crates-auth.py
node --test --test-timeout=30000 scripts/crates-publish-preflight.test.mjs
```

The regression first failed against the token-only workflow: every authentication
job lacked OIDC permission, and an available OIDC token was ignored. It now
checks action ordering, matching release conditions, permissions, all fallback
combinations, both real shell preflight requests against a local mock registry,
missing credentials, either crate being denied, and idempotent registration with
readback. Workflows CI runs it, including when the experiment itself changes.

See the [official crates.io documentation](https://crates.io/docs/trusted-publishing)
and the [pinned authentication action](https://github.com/rust-lang/crates-io-auth-action/tree/c6f97d42243bad5fab37ca0427f495c86d5b1a18)
for the registry protocol and token lifecycle.
