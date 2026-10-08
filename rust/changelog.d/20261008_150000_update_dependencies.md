---
bump: minor
---

### Changed
- Updated every Rust dependency to its latest release: `lino-objects-codec` 0.8.0 (brings `links-notation` 0.23.0 and `base64` 0.23.1), `syn` 3.0.6, `proc-macro2` 1.0.107 and `quote` 1.0.47.
- Moved both crates to the Rust 2024 edition and the MSRV-aware dependency resolver 3, and raised `rust-version` from 1.75 to 1.87, the oldest compiler that builds the updated dependency tree; CI now tests that minimum alongside stable.
