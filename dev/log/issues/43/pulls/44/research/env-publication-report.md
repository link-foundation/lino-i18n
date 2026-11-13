New registry evidence for the downstream dependency refresh on 2026-11-13: the source migration is present, but consumers still receive the older published graph.

```sh
npm view lino-env@latest version dependencies --json
# version 0.2.8; links-notation ^0.11.2
npm view links-notation@latest version
# 0.31.3
```

Current `js/package.json` on this repository's main says **1.0.2** and `links-notation >=0.25.2 <0.28.0`. Even publishing that source alone would still exclude current 0.31.3, so please assess the current grammar, update the ceiling with environment configuration tests, and publish a new version. Preserve the intended post-1.0 environment behavior during the migration.

Downstream https://github.com/link-foundation/lino-i18n/pull/44 uses latest `lino-arguments 0.4.1`, which still resolves `lino-env 0.2.8` and nested parser 0.11.2. The local workaround is to retain the parent-supported parser and document the exception, rather than force a potentially incompatible grammar through an override. Our CLI/configuration suites pass. A coordinated lino-arguments range migration will be needed when the new lino-env release is available. This is fresh publication/range evidence for this existing report, not a claim of a reproduced parser failure.
