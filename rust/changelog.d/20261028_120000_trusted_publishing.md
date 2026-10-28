---
bump: patch
---

### Changed
- Prefer crates.io trusted publishing for both Rust crates, retaining `CARGO_REGISTRY_TOKEN` and `CARGO_TOKEN` as fallbacks when OIDC is unavailable.
