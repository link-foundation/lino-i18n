# lino-i18n Rust Changelog





## [0.4.0] - 2026-10-08

### Changed
- Updated every Rust dependency to its latest release: `lino-objects-codec` 0.8.0 (brings `links-notation` 0.23.0 and `base64` 0.23.1), `syn` 3.0.6, `proc-macro2` 1.0.107 and `quote` 1.0.47.
- Moved both crates to the Rust 2024 edition and the MSRV-aware dependency resolver 3, and raised `rust-version` from 1.75 to 1.87, the oldest compiler that builds the updated dependency tree; CI now tests that minimum alongside stable.

## [0.3.0] - 2026-10-08

### Fixed

- Preserve scalar parent translations as `label` children when formatting nested catalogues, and resolve `foo` from `foo.label` when no explicit `foo` translation exists.

### Added
- Configurable compatibility aliases for deeper nested migration keys.

### Fixed

- Catch Rust release-script compile failures during pull request linting and clean up release package metadata.

### Fixed
- Kept Rust workspace path dependency and lockfile package versions in sync during release version bumps so release builds can resolve companion crates.

Synchronize a clean release checkout before versioning, consume published fragments, and validate all workspace changes with strict CI guards.

## [0.2.0] - 2026-05-18

### Fixed

- Preserve scalar parent translations as `label` children when formatting nested catalogues, and resolve `foo` from `foo.label` when no explicit `foo` translation exists.

### Added
- Configurable compatibility aliases for deeper nested migration keys.

### Fixed

- Catch Rust release-script compile failures during pull request linting and clean up release package metadata.

### Fixed
- Kept Rust workspace path dependency and lockfile package versions in sync during release version bumps so release builds can resolve companion crates.

## [0.1.0] - 2026-05-18

### Fixed

- Preserve scalar parent translations as `label` children when formatting nested catalogues, and resolve `foo` from `foo.label` when no explicit `foo` translation exists.

### Added
- Configurable compatibility aliases for deeper nested migration keys.

### Fixed

- Catch Rust release-script compile failures during pull request linting and clean up release package metadata.

## [0.0.1] - 2026-05-16

Initial release of the Rust `lino-i18n` crates.

- `lino-i18n` runtime crate for `.lino` catalogue loading, interpolation,
  plural selection, contexts, namespaces, and fallback locales.
- `lino-i18n-macros` proc-macro crate with compile-time catalogue embedding.
- Automated crates.io publishing, GitHub release creation, and generated docs
  deployment through `.github/workflows/rust.yml`.