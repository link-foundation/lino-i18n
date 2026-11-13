Registry snapshot: 2026-11-13T22:32:46.290698+00:00. `Before` is main at 3da5027; `after` is this PR.

Every lockfile crate and every direct dependency in workspace/member manifests and standalone rust-script cargo blocks. Build metadata (+spec-1.1.0) does not affect Cargo requirement matching.

| Crate | Before resolved | After resolved | Registry latest | After direct requirements / location | Reason |
| --- | --- | --- | --- | --- | --- |
| aho-corasick | 1.1.5 | 1.1.5 | 1.1.5 | transitive | Current. |
| autocfg | 1.5.1 | 1.5.1 | 1.5.1 | transitive | Current. |
| base64 | 0.23.1 | 0.23.1 | 0.23.1 | transitive | Current. |
| calendrical_calculations | 0.2.4 | 0.2.4 | 0.2.4 | transitive | Current. |
| chrono | helper only | helper only | 0.4.45 | rust/scripts/collect-changelog.rs: 0.4.45; rust/scripts/create-changelog-fragment.rs: 0.4.45; rust/scripts/version-and-commit.rs: 0.4.45 | Current. |
| core_maths | 0.1.1 | 0.1.1 | 0.1.1 | transitive | Current. |
| displaydoc | 0.2.7 | 0.2.7 | 0.2.7 | transitive | Current. |
| either | 1.19.0 | 1.19.0 | 1.19.0 | transitive | Current. |
| equivalent | 1.0.2 | 1.0.3 | 1.0.3 | transitive | Current. |
| fixed_decimal | 0.7.2 | 0.7.3 | 0.7.3 | transitive | Current. |
| formatjs_icu_messageformat | 0.3.1 | 0.3.3 | 0.3.3 | rust/lino-i18n/Cargo.toml: 0.3.3 | Current. |
| formatjs_icu_messageformat_parser | 1.1.1 | 2.0.1 | 2.0.1 | transitive | Current. |
| formatjs_icu_skeleton_parser | 0.1.2 | 0.1.3 | 0.1.3 | transitive | Current. |
| hashbrown | 0.17.1 | 0.17.1 | 0.17.1 | transitive | Current. |
| icu | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_calendar | 2.2.1 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_calendar_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_casemap | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_casemap_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_collator | 2.2.1 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_collator_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_collections | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_datetime | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_datetime_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_decimal | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_decimal_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_experimental | 0.5.0 | 0.7.0 | 0.7.0 | transitive | Current. |
| icu_experimental_data | 0.5.0 | 0.7.0 | 0.7.0 | transitive | Current. |
| icu_list | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_list_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_locale | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_locale_core | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_locale_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_locale_fallback | helper only | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_locale_fallback_data | helper only | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_normalizer | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_normalizer_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_pattern | 0.4.2 | 0.5.1 | 0.5.1 | transitive | Current. |
| icu_plurals | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_plurals_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_properties | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_properties_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_provider | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_segmenter | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_segmenter_data | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_time | 2.2.0 | 2.4.0 | 2.4.0 | transitive | Current. |
| icu_time_data | 2.2.1 | 2.4.0 | 2.4.0 | transitive | Current. |
| indexmap | 2.14.2 | 2.14.2 | 2.14.2 | transitive | Current. |
| itoa | 1.0.18 | 1.0.19 | 1.0.19 | transitive | Current. |
| ixdtf | 0.6.6 | 0.6.7 | 0.6.7 | transitive | Current. |
| libm | 0.2.16 | 0.2.16 | 0.2.16 | transitive | Current. |
| links-notation | 0.27.1 | 0.27.1 | 0.31.3 | transitive | Published lino-objects-codec 0.9.3 still requires ^0.27.1. Upstream main has ^0.31.3 but has not published the Rust migration. Latest published codec retained; upstream publication report linked in ANALYSIS.md. |
| links-notation-macro | 0.1.2 | 0.1.2 | 0.1.2 | transitive | Current. |
| lino-objects-codec | 0.9.2 | 0.9.3 | 0.9.3 | rust/lino-i18n/Cargo.toml: 0.9.3; rust/lino-i18n-macros/Cargo.toml: 0.9.3 | Current. |
| litemap | 0.8.3 | 0.8.3 | 0.8.3 | transitive | Current. |
| memchr | 2.8.3 | 2.8.3 | 2.8.3 | transitive | Current. |
| nom | 8.0.0 | 8.0.0 | 8.0.0 | transitive | Current. |
| num-bigint | 0.4.8 | 0.4.8 | 0.5.1 | transitive | num-rational 0.4.2 / calendrical_calculations 0.2.4 require num-bigint ^0.4; latest 0.5 has an incompatible API. Keep the newest compatible release until those latest parents migrate. |
| num-integer | 0.1.47 | 0.1.47 | 0.1.47 | transitive | Current. |
| num-rational | 0.4.2 | 0.4.2 | 0.4.2 | transitive | Current. |
| num-traits | 0.2.19 | 0.2.19 | 0.2.19 | transitive | Current. |
| once_cell | 1.21.4 | 1.21.4 | 1.21.4 | transitive | Current. |
| potential_utf | 0.1.6 | 0.1.6 | 0.1.6 | transitive | Current. |
| proc-macro2 | 1.0.107 | 1.0.107 | 1.0.107 | rust/lino-i18n-macros/Cargo.toml: 1.0.107 | Current. |
| quote | 1.0.47 | 1.0.47 | 1.0.47 | rust/lino-i18n-macros/Cargo.toml: 1.0.47 | Current. |
| regex | 1.13.1 | 1.13.1 | 1.13.1 | rust/scripts/bump-version.rs: 1.13.1; rust/scripts/check-changelog-fragment.rs: 1.13.1; rust/scripts/check-release-needed.rs: 1.13.1; rust/scripts/collect-changelog.rs: 1.13.1; rust/scripts/create-github-release.rs: 1.13.1; rust/scripts/get-bump-type.rs: 1.13.1; rust/scripts/get-version.rs: 1.13.1; rust/scripts/publish-crate.rs: 1.13.1; rust/scripts/version-and-commit.rs: 1.13.1; rust/scripts/wait-for-crate.rs: 1.13.1 | Current. |
| regex-automata | 0.4.18 | 0.4.18 | 0.4.18 | transitive | Current. |
| regex-syntax | 0.8.11 | 0.8.11 | 0.8.11 | transitive | Current. |
| serde | 1.0.229 | 1.0.229 | 1.0.229 | rust/scripts/check-release-needed.rs: 1.0.229; rust/scripts/create-github-release.rs: 1.0.229; rust/scripts/version-and-commit.rs: 1.0.229 | Current. |
| serde_core | 1.0.229 | 1.0.229 | 1.0.229 | transitive | Current. |
| serde_derive | 1.0.229 | 1.0.229 | 1.0.229 | transitive | Current. |
| serde_json | 1.0.151 | 1.0.154 | 1.0.154 | rust/scripts/check-release-needed.rs: 1.0.154; rust/scripts/create-github-release.rs: 1.0.154; rust/scripts/publish-crate.rs: 1.0.154; rust/scripts/version-and-commit.rs: 1.0.154; rust/scripts/wait-for-crate.rs: 1.0.154 | Current. |
| smallvec | 1.16.2 | 1.16.5 | 1.16.5 | transitive | Current. |
| stable_deref_trait | 1.2.1 | 1.2.1 | 1.2.1 | transitive | Current. |
| syn | 3.0.9 | 3.0.10 | 3.0.10 | rust/lino-i18n-macros/Cargo.toml: 3.0.10 | Current. |
| synstructure | 0.14.0 | 0.14.0 | 0.14.0 | transitive | Current. |
| tinystr | 0.8.4 | 0.8.5 | 0.8.5 | transitive | Current. |
| toml | helper only | helper only | 1.2.1+spec-1.1.0 | rust/scripts/check-version-modification.rs: 1.2.1 | Current. |
| unicode-ident | 1.0.26 | 1.0.27 | 1.0.27 | transitive | Current. |
| ureq | helper only | helper only | 3.5.2 | rust/scripts/check-release-needed.rs: 3.5.2; rust/scripts/publish-crate.rs: 3.5.2; rust/scripts/version-and-commit.rs: 3.5.2; rust/scripts/wait-for-crate.rs: 3.5.2 | Current. |
| utf16_iter | 1.0.5 | 1.1.0 | 1.1.0 | transitive | Current. |
| utf8_iter | 1.0.4 | 1.1.0 | 1.1.0 | transitive | Current. |
| utf_types | helper only | 1.0.0 | 1.0.0 | transitive | Current. |
| walkdir | helper only | helper only | 2.5.0 | rust/scripts/check-file-size.rs: 2.5.0 | Current. |
| write16 | 1.0.0 | 1.0.0 | 1.0.0 | transitive | Current. |
| writeable | 0.6.4 | 0.6.4 | 0.6.4 | transitive | Current. |
| yoke | 0.8.3 | 0.8.4 | 0.8.4 | transitive | Current. |
| yoke-derive | 0.8.4 | 0.8.4 | 0.8.4 | transitive | Current. |
| zerofrom | 0.1.8 | 0.1.8 | 0.1.8 | transitive | Current. |
| zerofrom-derive | 0.1.8 | 0.1.8 | 0.1.8 | transitive | Current. |
| zerotrie | 0.2.5 | 0.2.5 | 0.2.5 | transitive | Current. |
| zerovec | 0.11.8 | 0.11.9 | 0.11.9 | transitive | Current. |
| zerovec-derive | 0.11.6 | 0.11.7 | 0.11.7 | transitive | Current. |
| zmij | 1.0.23 | 1.0.23 | 1.0.23 | transitive | Current. |
