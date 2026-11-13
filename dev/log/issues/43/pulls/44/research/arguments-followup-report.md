Verified the latest published `lino-arguments 0.4.1` during https://github.com/link-foundation/lino-i18n/pull/44 on 2026-11-13. Its own grammar range has moved forward, but the environment dependency still retains a second parser:

```sh
npm view lino-arguments@0.4.1 dependencies --json
# includes lino-env ^0.2.8
npm view lino-env@0.2.8 dependencies --json
# links-notation ^0.11.2
```

The current parser latest dist-tag is 0.31.3. lino-env's main has a 1.x source migration, while its latest published npm version remains 0.2.8. Publication/range evidence was added to link-foundation/lino-env#33. Please coordinate a lino-arguments release with the published new lino-env API and environment/CLI compatibility tests. A root override would cross a major environment API and is not a safe downstream substitute. Our local CLI tests pass with the latest published graph; its retained nested parser is explicitly inventoried.
