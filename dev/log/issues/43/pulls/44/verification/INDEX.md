# Preserved raw logs

CI names identify workflow/run IDs; run metadata and head SHAs are in `../github/`. Local command exit statuses are in the `*-results.json` files. Line references in ANALYSIS.md refer to the uncompressed bytes. Read with `gzip -dc NAME.log.gz` and bounded line ranges. Checksums below are SHA-256 of uncompressed data; gzip headers have a fixed zero timestamp.

| Raw log | Lines | Uncompressed bytes | SHA-256 |
| --- | --- | --- | --- |
| [adapter-ci.log.gz](adapter-ci.log.gz) | 7 | 265 | `e2abc7c2249ee579eab38fbb87c5ebc144e5ab2ff1f5ab8132023718df977afe` |
| [after-crates-auth.log.gz](after-crates-auth.log.gz) | 15 | 1510 | `fa8746cc58ce92252e2d3cfeda9deabab52de3311aad49871b020d2ca5bbc79a` |
| [before-crates-auth.log.gz](before-crates-auth.log.gz) | 55 | 4717 | `fe5818f5ebda3eb7dc144917b40df04273a2831155f3514b6265b8eb9e0c853f` |
| [cargo-audit.log.gz](cargo-audit.log.gz) | 0 | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| [cargo-update.log.gz](cargo-update.log.gz) | 35 | 1566 | `756e452f84547e057474a45cca665cfab31391a20ab52dedbf8692fbe9a1eee9` |
| [ci-policy.log.gz](ci-policy.log.gz) | 5 | 244 | `554afd5fba9d5427d5ec311aabbe3a10cf1ba4eee0560af9cc5fe85f192f6a50` |
| [crates-auth.log.gz](crates-auth.log.gz) | 15 | 1510 | `9804c9189fe4baec0d87881a8bee6a91ed68b828f844ffc4e48fb2b10f001529` |
| [docs-check.log.gz](docs-check.log.gz) | 1 | 32 | `da21b6417d59a3ae820ba899e0f5a2ecaaf70334d8cf47708d036bbb322fe360` |
| [evidence-secrets.log.gz](evidence-secrets.log.gz) | 0 | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| [experiment-format.log.gz](experiment-format.log.gz) | 2 | 88 | `18cbf14974dc658817709442d972ae42d73e94435623cffb73d0c03e5bef1706` |
| [file-lines.log.gz](file-lines.log.gz) | 0 | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| [git-hook.log.gz](git-hook.log.gz) | 8 | 405 | `21cce0b3186a4941cc6f57abff851beb9f3d655ee04206c473dbf35b6de6fcd7` |
| [js-duplication.log.gz](js-duplication.log.gz) | 215 | 14320 | `947dc2af0fea56d849dfa5dc2c121af6e3211a946b658869d6d7c70c23f01b26` |
| [js-format.log.gz](js-format.log.gz) | 4 | 144 | `740cac75d60dc003a7bb0ebef5426c897d256b9919cf231d158676bbc25b2543` |
| [js-lint-initial.log.gz](js-lint-initial.log.gz) | 4 | 53 | `0414dc1ee720558b46e1d3682ff93bdd0bb301ed3713a75a1ad7ace2d2da611e` |
| [js-lint.log.gz](js-lint.log.gz) | 2 | 77 | `f2ad8ce2b485dcad4f1348d211a47e0d94f2fc4d97ed9d858850bb958d667c60` |
| [js-pack.log.gz](js-pack.log.gz) | 105 | 3728 | `0e99a2a69e3837b59ae87bd880aa4ffb3c992db4100ade0679d026e241c7d50f` |
| [js-secrets.log.gz](js-secrets.log.gz) | 2 | 273 | `a18b0a0ea4cc6a52014d771e1337ac0252e347d16ffda8ac3a495ddc495d3a93` |
| [js-types-initial.log.gz](js-types-initial.log.gz) | 4 | 272 | `cc30b7bfe71eac3e63d2c7e3c0d65fdf6d25412fbcd891d0e2854c81450b37ae` |
| [js-types.log.gz](js-types.log.gz) | 2 | 296 | `f3d130dd2ec9e0ffce51ddbeaa1cafcddb5ac0aa42df592614736b950c4cbfb7` |
| [node-test.log.gz](node-test.log.gz) | 219 | 18008 | `dd6c11aaa44db271b4d3505c62f914728926e8663353732a86470de81690f9f1` |
| [npm-bundle-baseline-install.log.gz](npm-bundle-baseline-install.log.gz) | 15 | 327 | `86a4d58445e4999b8480e8f4b6bdb88b67afffc7dc44271aa5f31ad0a35edf06` |
| [npm-bundle-legacy-install.log.gz](npm-bundle-legacy-install.log.gz) | 15 | 331 | `18f1fbb1162328b5a5485a97762dfbd50acf5b933a22e55cceba602f63347999` |
| [npm-bundle-overrides-install.log.gz](npm-bundle-overrides-install.log.gz) | 15 | 327 | `90834b7d8ab3c10582287087c4f5c2ca733631bee05f6c8cfca078b8de192e39` |
| [npm-bundle-probe.log.gz](npm-bundle-probe.log.gz) | 96 | 2000 | `bb45297c90b9e07ef65fbc6b44decd9d5c370421fbdd789445ea15bd17b60735` |
| [npm-check-updates.log.gz](npm-check-updates.log.gz) | 42 | 2269 | `31744ed5cd133fe8b6246900ca9c153e6575c514545fba53432225b09cf8dcc7` |
| [npm-install.log.gz](npm-install.log.gz) | 10 | 299 | `eb8f9470a57fbcfed10277f83d1daeb7bf1baff2379042b3870288766ff6fae7` |
| [npm-tool-install.log.gz](npm-tool-install.log.gz) | 15 | 337 | `580a0e48243da4c0e67f0c6a035fafd8df9c241f5f84507aac50c82ceb74dbc4` |
| [npm-tool-removal.log.gz](npm-tool-removal.log.gz) | 7 | 146 | `3da300ad414d49d08f0d9df8342a71b334c8f8354a89c0b167989632f5cb7f38` |
| [npm-update.log.gz](npm-update.log.gz) | 4 | 119 | `08b87dc0b5819e8e1543c2f4d83db8fe5770ff60409a276aa37cfa9f278ca69e` |
| [npm12-install.log.gz](npm12-install.log.gz) | 2 | 23 | `ed435fab73a9b746a43a14339ba74fe949add5a81a8c6f3c8b718d53164f5cfd` |
| [npm12-pack.log.gz](npm12-pack.log.gz) | 0 | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| [pin-guard.log.gz](pin-guard.log.gz) | 1 | 76 | `4891608bb9d72c9a09da350f46e91faaff577e4e389efd50286b5674b7fb2285` |
| [pin-regression.log.gz](pin-regression.log.gz) | 6 | 233 | `b97c8bb3e3f7190a96406f99039c55436a8952ec4ae4d9f72e5cf952614fc69e` |
| [pip-audit-install.log.gz](pip-audit-install.log.gz) | 90 | 7211 | `3a86bd15b96a1ee749b42e9e1c07575310df120b60ca0a3787864c15e6397d16` |
| [pip-audit.log.gz](pip-audit.log.gz) | 1 | 31 | `15950a68a7ed99c59779717acefdceb3f69cfd31bde67d2c954f2a3cea4d7955` |
| [prettier-write.log.gz](prettier-write.log.gz) | 5 | 251 | `280a7ed0e62f3601f63c327e588b1d6307ba9ee7eef4af916012e690a3c36ff5` |
| [python-checks.log.gz](python-checks.log.gz) | 62 | 3344 | `bd1132277ed25b938cf6a645b0653e0e7c7fec28fb8703eb4b24e04a7dbf5ba9` |
| [python-install.log.gz](python-install.log.gz) | 19 | 1143 | `2c47cc4aac8d44e00da15072400d9a71652565b1cb7e6ac23095fc7383d297e1` |
| [rrweb-fallback.log.gz](rrweb-fallback.log.gz) | 1 | 45 | `4e0e0987892f68fb3559c189107a3fa12785ca6f6726a8837ad94844dd261a03` |
| [rust-build.log.gz](rust-build.log.gz) | 70 | 2480 | `3c5328d3a3e349498354bc0b4255d8e09ff8e705899dc80950e223f11dde2512` |
| [rust-clippy-fix.log.gz](rust-clippy-fix.log.gz) | 7 | 402 | `857bffcbc42d4f66f3bb3eacb6669da026fb4c841a3349d315241bb322df1b60` |
| [rust-clippy.log.gz](rust-clippy.log.gz) | 3 | 238 | `488b4553b6c360b8506c689fb60caedc4f9c51050064f4d669f82ec909a626ab` |
| [rust-doc.log.gz](rust-doc.log.gz) | 4 | 340 | `cf5166c28d90d1ca57733cec7f79017487e67066bcea3a068495ab927f8aecea` |
| [rust-fmt.log.gz](rust-fmt.log.gz) | 0 | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| [rust-test.log.gz](rust-test.log.gz) | 82 | 3523 | `a08542d5edee9078511b403d650346e6cc94a14882ac9b62bc9b03cb3ed5fd6b` |
| [shared-guards.log.gz](shared-guards.log.gz) | 7 | 321 | `0590bdfe01cb892bf1683d9ecc6eb008daca1241aeed8b89601958baac7c430f` |
| [zizmor-install.log.gz](zizmor-install.log.gz) | 9 | 554 | `64c0822cef85ac84ed4b76aee22f117efb60078ed7c79f5b6d1d5aea42ba6ef0` |
| [zizmor-pedantic.log.gz](zizmor-pedantic.log.gz) | 1229 | 71851 | `607ec682d1f1fe129f611d9efc28ec51308baa44b8c870e52e024835b57bc49b` |
| [zizmor.log.gz](zizmor.log.gz) | 0 | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
